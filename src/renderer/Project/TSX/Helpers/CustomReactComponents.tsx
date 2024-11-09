import React, { forwardRef, ComponentPropsWithRef } from 'react';

export const Input = forwardRef<
  HTMLInputElement,
  ComponentPropsWithRef<'input'>
>((props, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!e.currentTarget.disabled) {
      e.currentTarget.select();
    }
  };

  return (
    <input
      {...props}
      ref={ref}
      onClick={handleClick}
      onDoubleClick={handleClick}
    />
  );
});

Input.displayName = 'Input';
