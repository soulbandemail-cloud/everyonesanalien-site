import {Children,type ReactNode} from 'react';
/** Word-sized surface patches retain natural line wrapping and accessible text. */
export default function GlassText({children}:{children:ReactNode}){
 return Children.map(children,child=>typeof child==='string'?child.split(/(\s+)/).map((word,i)=>/^\s+$/.test(word)?word:<span key={i} data-glass-text style={{display:'inline-block'}}>{word}</span>):child);
}
