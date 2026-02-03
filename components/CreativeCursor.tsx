import React, { useEffect, useRef } from 'react';

export const CreativeCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable on touch devices or small screens
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    let mouseX = 0;
    let mouseY = 0;
    let followerX = 0;
    let followerY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Instant update for the central dot
      cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    };

    const animate = () => {
      // Smooth lerp for the follower circle
      followerX += (mouseX - followerX) * 0.12; 
      followerY += (mouseY - followerY) * 0.12;
      follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0)`;
      requestAnimationFrame(animate);
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Detect interactive elements to trigger hover state
      const isClickable = 
        target.closest('button') || 
        target.closest('a') || 
        target.closest('input') || 
        target.closest('[role="button"]') ||
        target.classList.contains('cursor-pointer');
      
      if (isClickable) {
        follower.classList.add('scale-[2.5]', 'bg-white/10', 'border-transparent', 'backdrop-blur-[1px]');
        cursor.classList.add('scale-0'); // Hide the dot on hover
      } else {
        follower.classList.remove('scale-[2.5]', 'bg-white/10', 'border-transparent', 'backdrop-blur-[1px]');
        cursor.classList.remove('scale-0');
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);
    const animFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <>
      {/* Primary Cursor Dot */}
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-[9999] -ml-[3px] -mt-[3px] mix-blend-exclusion hidden md:block transition-transform duration-200"
      />
      {/* Trailing Creative Circle */}
      <div 
        ref={followerRef} 
        className="fixed top-0 left-0 w-8 h-8 border border-white/40 rounded-full pointer-events-none z-[9998] -ml-4 -mt-4 hidden md:block transition-all duration-300 ease-out will-change-transform"
      />
    </>
  );
};