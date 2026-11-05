"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function ScrollPurchaseCta({children}: {children:ReactNode}) {
  const end = useRef<HTMLDivElement>(null);
  const [visible,setVisible] = useState(false);
  useEffect(() => {
    const element=end.current;
    if (!element) return;
    const check=()=>{
      const bounds=element.getBoundingClientRect();
      if(bounds.top < window.innerHeight-64 && bounds.bottom>0) setVisible(true);
    };
    const observer=new IntersectionObserver(check,{rootMargin:"0px 0px -64px 0px"});
    observer.observe(element);
    window.addEventListener("scroll",check,{passive:true});
    return ()=>{observer.disconnect();window.removeEventListener("scroll",check);};
  },[]);
  return <div ref={end} style={{minHeight:64}}>{visible ? children : null}</div>;
}
