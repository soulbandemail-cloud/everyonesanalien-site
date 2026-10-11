/* eslint-disable @next/next/no-img-element -- Reuse the local artwork at its native proportions in a tiny collection thumbnail. */
import {CLOTHING,type ClothingId,type Outfit} from '@/lib/ship/clothing';
export default function ClothingCollection({outfit,onChoose}:{outfit:Outfit;onChoose?:(id:ClothingId)=>void}){
 return <div className="clothing-collection">{CLOTHING.map(item=><button key={item.id} type="button" aria-pressed={outfit===item.id} onClick={()=>onChoose?.(item.id)} className="clothing-row pink-border-glow border border-white bg-[#00082d] px-3 py-2 transition-colors duration-200">
  <span className="clothing-thumbnail"><img src={item.thumbnail} alt="" width="38" height="38"/></span><span>{item.name}</span>
 </button>)}</div>;
}
