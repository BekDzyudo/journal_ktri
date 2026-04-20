import React from "react";

function Divider({ color = "#f97316"}) {
  return (
    <div className={`relative my-5 md:my-14`}>
      <div
        className="h-[1px] w-full"
        style={{
          background: `linear-gradient(to right, transparent, ${color}, transparent)`,
          opacity: 0.6,
        }}
      />
      <div
        className="absolute inset-0 h-[2px] blur-md"
        style={{
          background: `linear-gradient(to right, transparent, ${color}, transparent)`,
          opacity: 0.35,
        }}
      />
       <div
        className="absolute inset-0 h-[6px] blur-xl"
        style={{
          background: `linear-gradient(to right, transparent, ${color}, transparent)`,
          opacity: 0.2,
        }}
      />
    </div>
  );
}


export default Divider;

