'use strict';
if (process.send) {
  const timer=setInterval(()=>{
    if(process.connected)process.send({type:'qatu-carga-metricas',pid:process.pid,at:new Date().toISOString(),cpu:process.cpuUsage(),memory:process.memoryUsage()});
  },1000);
  timer.unref();
}
