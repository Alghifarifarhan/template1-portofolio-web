import React from 'react';

interface CustomeTextProps {
  title: string;
  className?: string;
  style?: React.CSSProperties;
}

const CustomeText: React.FC<CustomeTextProps> = ({ title, className, style }) => {
  return (
    <div
      style={style}
      className={`leading-tight ${className || ''}`}
    >
      {title}
    </div>
  );
};

export default CustomeText;
