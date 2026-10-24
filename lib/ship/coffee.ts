export type CoffeePose={lower:number;reach:number;hand:{x:number;y:number;z:number};lean:number};
export const coffeeEase=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
/** Eight seconds including a pause to drink and a gentle release. */
export function coffeePhase(t:number){
 const lower=coffeeEase(t/.9)*(1-coffeeEase((t-7)/1));
 const reach=coffeeEase((t-.8)/.6)*(1-coffeeEase((t-6.7)/.8));
 const lift=coffeeEase((t-1.4)/1.2)*(1-coffeeEase((t-5)/1.7));
 const sip=coffeeEase((t-3.5)/.5)*(1-coffeeEase((t-4.6)/.4));
 return {lower,reach,lift,sip,lean:lower*(1-lift)*.65};
}
