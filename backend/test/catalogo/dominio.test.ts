import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {test} from 'node:test';
import {entradaOferta,filtros,editarRecursos,type Publicacion} from '../../src/modules/catalogo/dominio/oferta';
const base={tipo:'herramienta',categoriaId:'perforacion',zonaId:'ayacucho',titulo:'Taladro para concreto',descripcion:'Equipo para trabajos de mantenimiento y proyectos del hogar.',incluye:['Equipo y accesorios'],condiciones:['Coordinar retiro y devolución'],modalidadPrecio:'fija',tarifaCentimos:3500,unidad:'día',activa:true,recursos:[{identificador:'Unidad 1',activo:true}]};
test('dinero y unidades: no admite fracciones, valores no finitos, tarifas negativas ni cotización de herramienta',()=>{
 for(const importe of [-1,0,3.5,NaN,Infinity,100000000,'3500',null])assert.throws(()=>entradaOferta({...base,tarifaCentimos:importe}));
 assert.throws(()=>entradaOferta({...base,unidad:'servicio'}));assert.throws(()=>entradaOferta({...base,modalidadPrecio:'cotizacion',tarifaCentimos:null,unidad:null}));
 assert.equal(entradaOferta({...base,tipo:'servicio',categoriaId:'gasfiteria',modalidadPrecio:'cotizacion',tarifaCentimos:null,unidad:null}).datos.tarifaCentimos,null);
});
test('publicación rechaza suplantación, categorías incompatibles, recursos duplicados y oferta activa sin unidades',()=>{
 for(const d of [{proveedorId:randomUUID()},{estadoModeracion:'permitida'},{categoriaId:'gasfiteria'},{zonaId:'otra-zona'},{recursos:[]},{recursos:[{identificador:'Unidad',activo:false}]},{recursos:[{identificador:'A',activo:true},{identificador:'a',activo:true}]}])assert.throws(()=>entradaOferta({...base,...d}));
 assert.throws(()=>entradaOferta({...base,recursos:[{id:randomUUID(),identificador:'Ajeno',activo:true}]}));
});
test('edición conserva IDs de recursos y no permite reactivar una retirada',()=>{
 const recursoId=randomUUID(),actual={...base,...entradaOferta(base).datos,id:randomUUID(),proveedorId:randomUUID(),version:1,estadoModeracion:'permitida',creadoEn:'',actualizadoEn:'',recursos:[{id:recursoId,identificador:'Unidad 1',activo:true}]} as Publicacion;
 assert.throws(()=>editarRecursos(actual,entradaOferta(base).datos));
 const editada=entradaOferta({...base,recursos:[...actual.recursos,{identificador:'Unidad 2',activo:true}],versionActual:1},true).datos;
 assert.doesNotThrow(()=>editarRecursos(actual,editada));assert.throws(()=>editarRecursos({...actual,estadoModeracion:'retirada'},editada));
 assert.doesNotThrow(()=>editarRecursos({...actual,estadoModeracion:'retirada'},{...editada,activa:false}));
});
test('filtros limitan presupuesto y páginas, rechazan arrays repetidos y claves desconocidas',()=>{
 assert.equal(filtros({}).limit,20);assert.equal(filtros({limit:'50',precioMaximoCentimos:'0'}).precioMaximoCentimos,0);
 for(const f of [{limit:'51'},{page:'0'},{q:['a','b']},{orden:'sql'},{precioMaximoCentimos:'3.5'},{q:'x'.repeat(201)},{tipo:'servicio',categoriaId:'perforacion'},{proveedorId:randomUUID()}])assert.throws(()=>filtros(f));
});
