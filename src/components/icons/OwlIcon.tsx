import React from 'react'

interface OwlIconProps {
  className?: string
}

export const OwlIcon: React.FC<OwlIconProps> = ({ className = "w-6 h-6" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main owl body - very round and fluffy */}
    <ellipse 
      cx="12" 
      cy="13" 
      rx="8" 
      ry="9" 
      fill="currentColor"
    />
    
    {/* Owl head - overlapping for cute round look */}
    <circle 
      cx="12" 
      cy="10" 
      r="7.5" 
      fill="currentColor"
    />
    
    {/* Cute ear tufts - small and fluffy */}
    <ellipse cx="7.5" cy="4.5" rx="1.2" ry="2.8" fill="currentColor" transform="rotate(-25 7.5 4.5)" />
    <ellipse cx="16.5" cy="4.5" rx="1.2" ry="2.8" fill="currentColor" transform="rotate(25 16.5 4.5)" />
    
    {/* Eye patches - lighter background for eyes */}
    <circle cx="9.5" cy="9" r="3.2" fill="white" opacity="0.95" />
    <circle cx="14.5" cy="9" r="3.2" fill="white" opacity="0.95" />
    
    {/* Large adorable eyes - bigger for maximum cuteness */}
    <circle cx="9.5" cy="9" r="2.8" fill="#2D3748" />
    <circle cx="14.5" cy="9" r="2.8" fill="#2D3748" />
    
    {/* Eye highlights - multiple for sparkly effect */}
    <circle cx="10.2" cy="8.2" r="0.8" fill="white" />
    <circle cx="15.2" cy="8.2" r="0.8" fill="white" />
    <circle cx="9.8" cy="9.5" r="0.3" fill="white" opacity="0.7" />
    <circle cx="14.8" cy="9.5" r="0.3" fill="white" opacity="0.7" />
    
    {/* Super cute tiny beak - more like a little button */}
    <ellipse 
      cx="12" 
      cy="12" 
      rx="0.8" 
      ry="1.2" 
      fill="#FFA500"
    />
    
    {/* Belly marking - lighter area for contrast */}
    <ellipse 
      cx="12" 
      cy="16" 
      rx="4" 
      ry="5" 
      fill="white" 
      opacity="0.15"
    />
    
    {/* Wing details - subtle texture */}
    <ellipse cx="6.5" cy="14" rx="2" ry="4" fill="currentColor" opacity="0.3" />
    <ellipse cx="17.5" cy="14" rx="2" ry="4" fill="currentColor" opacity="0.3" />
    
    {/* Cute feet - tiny and adorable */}
    <ellipse cx="10" cy="21" rx="1" ry="0.8" fill="#FFA500" />
    <ellipse cx="14" cy="21" rx="1" ry="0.8" fill="#FFA500" />
    
    {/* Little toe details */}
    <circle cx="9.3" cy="21.5" r="0.2" fill="#FF8C42" />
    <circle cx="10.7" cy="21.5" r="0.2" fill="#FF8C42" />
    <circle cx="13.3" cy="21.5" r="0.2" fill="#FF8C42" />
    <circle cx="14.7" cy="21.5" r="0.2" fill="#FF8C42" />
    
    {/* Optional cute cheek blush */}
    <ellipse cx="5.5" cy="11" rx="1.2" ry="0.8" fill="#FFB6C1" opacity="0.4" />
    <ellipse cx="18.5" cy="11" rx="1.2" ry="0.8" fill="#FFB6C1" opacity="0.4" />
  </svg>
)

export default OwlIcon
