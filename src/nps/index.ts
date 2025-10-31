export { initNps as NPS } from './initNPS';


import { initNps }  from './initNPS';
if (typeof window !== 'undefined') {
  (window as any).InitNps = initNps; // nota la mayúscula, estilo constructor
}