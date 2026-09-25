import {Box3,Vector3} from './vendor/three.module.js';
// Preserve the sculpted proportions: one scale factor on all three axes.
export function fitModelToMeasurement(model,axis,metres){
 const box=new Box3().setFromObject(model),size=box.getSize(new Vector3());
 if(axis==='x'&&size.z>size.x){model.rotation.y+=Math.PI/2;model.updateMatrixWorld(true);box.setFromObject(model).getSize(size);}
 if(!['x','y','z'].includes(axis)||!(size[axis]>0)||!Number.isFinite(metres)||metres<=0)throw new RangeError('A finite positive size is required');
 const factor=metres/size[axis];model.scale.multiplyScalar(factor);model.updateMatrixWorld(true);box.setFromObject(model);
 const center=box.getCenter(new Vector3()),origin=model.parent?model.parent.getWorldPosition(new Vector3()):new Vector3();
 model.position.x+=origin.x-center.x;model.position.z+=origin.z-center.z;model.position.y+=origin.y-box.min.y;
 model.updateMatrixWorld(true);box.setFromObject(model);return box.getSize(new Vector3());
}
