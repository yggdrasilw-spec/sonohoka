// Metres and seconds. Horizontal movement never depends on camera pitch.
export function walkPosition(position,heading,distance,bounds,obstacles=[]){
 const radius=.18,p={x:position.x,z:position.z};
 const blocked=(x,z)=>obstacles.some(b=>x>b.minX-radius&&x<b.maxX+radius&&z>b.minZ-radius&&z<b.maxZ+radius);
 const steps=Math.max(1,Math.ceil(Math.abs(distance)/.04));
 for(let i=0;i<steps;i++){
  const x=Math.max(bounds.minX,Math.min(bounds.maxX,p.x+Math.sin(heading)*distance/steps));
  if(!blocked(x,p.z))p.x=x;
  const z=Math.max(bounds.minZ,Math.min(bounds.maxZ,p.z+Math.cos(heading)*distance/steps));
  if(!blocked(p.x,z))p.z=z;
 }
 return p;
}
