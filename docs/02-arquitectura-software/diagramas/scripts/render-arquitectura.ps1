param([string]$GraphDirectory,[string]$ImageDirectory,[string]$VectorDirectory)
if(-not $VectorDirectory){$VectorDirectory=Join-Path (Split-Path $ImageDirectory -Parent) "svg"}
Add-Type -AssemblyName System.Drawing
$palette=@{person='#274777';container='#3f67ad';component='#a8c7eb';support='#d9e6f5';external='#8b9098';domain='#8fb6dc'}
function Draw-Text([float]$x,[float]$y,[string]$value,[float]$size,[string]$color='#24364d',[bool]$bold=$false,[bool]$left=$false,[float]$maxWidth=0){
 $style=[System.Drawing.FontStyle]::Regular;if($bold){$style=[System.Drawing.FontStyle]::Bold}
 $font=New-Object System.Drawing.Font('Arial',$size,$style,[System.Drawing.GraphicsUnit]::Pixel)
 if($maxWidth -gt 0){while($g.MeasureString($value,$font).Width -gt $maxWidth -and $size -gt 12){$font.Dispose();$size-=0.5;$font=New-Object System.Drawing.Font('Arial',$size,$style,[System.Drawing.GraphicsUnit]::Pixel)}}
 $brush=New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color))
 $format=New-Object System.Drawing.StringFormat;if(-not $left){$format.Alignment=[System.Drawing.StringAlignment]::Center}
 $g.DrawString($value,$font,$brush,[System.Drawing.PointF]::new($x,$y-$size),$format)
 $font.Dispose();$brush.Dispose();$format.Dispose()
}
$slugs=@('arquitectura-inicial-qatu','enfoque-arquitectonico-qatu','estilo-arquitectonico-qatu')
foreach($slug in $slugs){
 $data=Get-Content -LiteralPath (Join-Path $GraphDirectory ($slug+'.json')) -Raw -Encoding UTF8 | ConvertFrom-Json
 $bitmap=New-Object System.Drawing.Bitmap([int]$data.width,[int]$data.height)
 $g=[System.Drawing.Graphics]::FromImage($bitmap)
 $g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
 $g.TextRenderingHint=[System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
 $g.Clear([System.Drawing.Color]::White)
 Draw-Text 28 42 $data.title 28 '#172b43' $true $true
 Draw-Text 28 77 $data.subtitle 18 '#64748b' $false $true
 foreach($b in $data.boundaries){$pen=New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#8390a2'),1.5);$pen.DashStyle=[System.Drawing.Drawing2D.DashStyle]::Dash;$g.DrawRectangle($pen,[int]$b.x,[int]$b.y,[int]$b.w,[int]$b.h);$pen.Dispose();Draw-Text ($b.x+18) ($b.y+28) $b.title 19 '#3d526e' $true $true}
 foreach($edge in $data.edges){
  $pen=New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#667588'),1.8)
  if($edge.style -eq 'dashed'){$pen.DashStyle=[System.Drawing.Drawing2D.DashStyle]::Dash}
  for($i=0;$i -lt $edge.points.Count-1;$i++){$a=$edge.points[$i];$b=$edge.points[$i+1];$g.DrawLine($pen,[float]$a[0],[float]$a[1],[float]$b[0],[float]$b[1])}
  $a=$edge.points[$edge.points.Count-2];$b=$edge.points[$edge.points.Count-1];$dx=[float]$b[0]-[float]$a[0];$dy=[float]$b[1]-[float]$a[1];$len=[Math]::Sqrt($dx*$dx+$dy*$dy)
  if($len -gt 0){$ux=$dx/$len;$uy=$dy/$len;$pts=[System.Drawing.PointF[]]@([System.Drawing.PointF]::new($b[0],$b[1]),[System.Drawing.PointF]::new($b[0]-9*$ux+4*$uy,$b[1]-9*$uy-4*$ux),[System.Drawing.PointF]::new($b[0]-9*$ux-4*$uy,$b[1]-9*$uy+4*$ux));$g.FillPolygon([System.Drawing.Brushes]::SlateGray,$pts)}
  $pen.Dispose()
 }
 foreach($n in $data.nodes){
  $brush=New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($palette[$n.kind]))
  if($n.kind -eq 'person'){$g.FillEllipse($brush,[float]($n.x+$n.w/2-24),[float]($n.y-49),48,48)}
  $g.FillRectangle($brush,[int]$n.x,[int]$n.y,[int]$n.w,[int]$n.h);$brush.Dispose()
  $color='#142d48';if($n.kind -in @('person','container','external')){$color='#ffffff'}
  $first=$n.y+($n.h-(28+$n.lines.Count*23))/2+22
  Draw-Text ($n.x+$n.w/2) $first $n.title 22 $color $true $false ($n.w-24)
  for($i=0;$i -lt $n.lines.Count;$i++){Draw-Text ($n.x+$n.w/2) ($first+28+$i*23) $n.lines[$i] 17 $color $false $false ($n.w-20)}
 }
 foreach($edge in $data.edges){if($edge.label){$font=New-Object System.Drawing.Font('Arial',16,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel);$w=$g.MeasureString($edge.label,$font).Width+18;$font.Dispose();$g.FillRectangle([System.Drawing.Brushes]::White,[float]($edge.lx-$w/2),[float]($edge.ly-18),[float]$w,25);Draw-Text $edge.lx $edge.ly $edge.label 16 '#526176'}}
 $footer=$data.height-130;$g.DrawRectangle([System.Drawing.Pens]::LightGray,28,$footer,($data.width-56),110)
 Draw-Text 48 ($footer+25) 'Lectura del diagrama y límites' 18 '#25334a' $true $true
 for($i=0;$i -lt $data.notes.Count;$i++){Draw-Text 48 ($footer+51+$i*23) $data.notes[$i] 16 '#536378' $false $true ($data.width-96)}
 $bitmap.Save((Join-Path $ImageDirectory ($slug+'.png')),[System.Drawing.Imaging.ImageFormat]::Png)
 $g.Dispose();$bitmap.Dispose()
 foreach($extension in @('drawio')){[xml]$validated=Get-Content -LiteralPath (Join-Path $GraphDirectory ($slug+'.'+$extension)) -Raw -Encoding UTF8}
 [xml]$validatedSvg=Get-Content -LiteralPath (Join-Path $VectorDirectory ($slug+'.svg')) -Raw -Encoding UTF8
 Write-Output ($slug+': PNG generado; SVG y drawio válidos.')
}
