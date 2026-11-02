import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
  strokeWidth?: number | string;
}

export const PinterestIcon: React.FC<IconProps> = ({
  size = 24,
  color = "currentColor",
  className = "",
  style,
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.79-.17-2 .04-2.86.18-.78 1.18-5.01 1.18-5.01s-.3-.6-.3-1.49c0-1.4.81-2.44 1.82-2.44.86 0 1.27.64 1.27 1.41 0 .86-.55 2.15-.83 3.34-.24 1 .5 1.81 1.48 1.81 1.78 0 3.16-1.88 3.16-4.59 0-2.4-1.73-4.08-4.19-4.08-2.85 0-4.53 2.14-4.53 4.35 0 .86.33 1.79.75 2.29.08.1.09.19.07.29-.08.31-.25 1.01-.28 1.15-.05.19-.15.23-.34.14-1.25-.58-2.03-2.4-2.03-3.87 0-3.15 2.29-6.04 6.6-6.04 3.47 0 6.17 2.47 6.17 5.77 0 3.45-2.17 6.22-5.19 6.22-1.01 0-1.97-.53-2.3-1.15l-.63 2.39c-.23.87-.84 1.96-1.26 2.63.92.28 1.9.43 2.92.43 5.52 0 10-4.48 10-10S17.52 2 12 2z"
        fill={color}
        stroke="none"
      />
    </svg>
  );
};
