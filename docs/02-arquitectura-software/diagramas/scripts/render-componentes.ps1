param([string]$GraphPath,[string]$OutputPath)
Add-Type -AssemblyName System.Drawing
$graphData = Get-Content -LiteralPath $GraphPath -Raw -Encoding UTF8 | ConvertFrom-Json
$bitmap = New-Object System.Drawing.Bitmap([int]$graphData.width,[int]$graphData.height)
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::White)
$palette = @{person='#274777';container='#3f67ad';component='#a8c7eb';support='#d9e6f5';external='#8b9098'}
function Draw-Text([float]$x,[float]$y,[string]$value,[float]$size,[string]$color='#25334a',[bool]$bold=$false,[bool]$left=$false) {
 $fontStyle = [System.Drawing.FontStyle]::Regular
 if ($bold) {$fontStyle = [System.Drawing.FontStyle]::Bold}
 $font = New-Object System.Drawing.Font('Arial',$size,$fontStyle,[System.Drawing.GraphicsUnit]::Pixel)
 $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color))
 $format = New-Object System.Drawing.StringFormat
 if(-not $left){$format.Alignment=[System.Drawing.StringAlignment]::Center}
 $g.DrawString($value,$font,$brush,[System.Drawing.PointF]::new($x,$y-$size),$format)
 $font.Dispose();$brush.Dispose();$format.Dispose()
}
function Draw-Boundary([int]$x,[int]$y,[int]$w,[int]$h) {
 $pen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#7a8797'),1.5)
 $pen.DashStyle=[System.Drawing.Drawing2D.DashStyle]::Dash
 $g.DrawRectangle($pen,$x,$y,$w,$h);$pen.Dispose()
}
Draw-Text 28 42 $graphData.title 29 '#18283d' $true $true
Draw-Text 28 76 $graphData.subtitle 18 '#5c6879' $false $true
foreach($b in $graphData.boundaries){Draw-Boundary ([int]$b.x) ([int]$b.y) ([int]$b.w) ([int]$b.h);Draw-Text $(if($b.tx){[int]$b.tx}else{[int]$b.x+20}) ([int]$b.y+28) $b.title 19 '#263b58' $true $true}
foreach($edge in $graphData.edges){
 $pen=New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#697382'),1.6)
 if($edge.style -eq 'dashed'){$pen.DashStyle=[System.Drawing.Drawing2D.DashStyle]::Dash}
 for($i=0;$i -lt $edge.points.Count-1;$i++){$a=$edge.points[$i];$b=$edge.points[$i+1];$g.DrawLine($pen,[float]$a[0],[float]$a[1],[float]$b[0],[float]$b[1])}
 $a=$edge.points[$edge.points.Count-2];$b=$edge.points[$edge.points.Count-1]
 $dx=[float]$b[0]-[float]$a[0];$dy=[float]$b[1]-[float]$a[1];$len=[Math]::Sqrt($dx*$dx+$dy*$dy)
 if($len -gt 0){$ux=$dx/$len;$uy=$dy/$len;$triangle=[System.Drawing.PointF[]]@([System.Drawing.PointF]::new($b[0],$b[1]),[System.Drawing.PointF]::new($b[0]-9*$ux+4*$uy,$b[1]-9*$uy-4*$ux),[System.Drawing.PointF]::new($b[0]-9*$ux-4*$uy,$b[1]-9*$uy+4*$ux));$g.FillPolygon([System.Drawing.Brushes]::Gray,$triangle)}
 $pen.Dispose()
}
foreach($n in $graphData.nodes){
 $brush=New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($palette[$n.kind]))
 if($n.kind -eq 'person'){$g.FillEllipse($brush,[float]($n.x+$n.w/2-25),[float]($n.y-50),50,50)}
 $g.FillRectangle($brush,[int]$n.x,[int]$n.y,[int]$n.w,[int]$n.h);$brush.Dispose()
 $tc='#10263f';if($n.kind -in @('person','container','external')){$tc='#ffffff'}
 $first=$n.y+($n.h-(26+$n.lines.Count*22))/2+21
 Draw-Text ($n.x+$n.w/2) $first $n.title 21 $tc $true
 for($i=0;$i -lt $n.lines.Count;$i++){Draw-Text ($n.x+$n.w/2) ($first+26+$i*22) $n.lines[$i] 16 $tc}
}
foreach($edge in $graphData.edges){if($edge.label){$tw=$edge.label.Length*8.1+18;$g.FillRectangle([System.Drawing.Brushes]::White,[float]($edge.lx-$tw/2),[float]($edge.ly-18),[float]$tw,24);Draw-Text $edge.lx $edge.ly $edge.label 16 '#485669'}}
$pie=[int]$graphData.height-140
$g.DrawRectangle([System.Drawing.Pens]::LightGray,28,$pie,850,116)
$g.DrawRectangle([System.Drawing.Pens]::LightGray,908,$pie,960,116)
Draw-Text 48 ($pie+25) 'Leyenda' 18 '#25334a' $true $true
$legend=@(@('person','Persona'),@('container','Contenedor'),@('component','Módulo'),@('support','Soporte'),@('external','Sistema externo'))
for($i=0;$i -lt $legend.Count;$i++){$brush=New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($palette[$legend[$i][0]]));$g.FillRectangle($brush,(48+$i*164),($pie+40),148,30);$brush.Dispose();$tc='#ffffff';if($i -in @(2,3)){$tc='#10263f'};Draw-Text (122+$i*164) ($pie+60) $legend[$i][1] 15 $tc}
Draw-Text 48 ($pie+94) 'Flecha: relación etiquetada - línea discontinua: evento, opción o límite' 16 '#485669' $false $true
Draw-Text 928 ($pie+25) 'Notas de arquitectura' 18 '#25334a' $true $true
for($i=0;$i -lt $graphData.notes.Count;$i++){Draw-Text 928 ($pie+52+$i*25) $graphData.notes[$i] 15 '#485669' $false $true}
$bitmap.Save($OutputPath,[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$bitmap.Dispose()
