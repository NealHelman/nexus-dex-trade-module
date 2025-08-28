import styled from '@emotion/styled';

export interface ArrowStyles {
  direction: 'up' | 'down' | 'left' | 'right';
  width: number;
  height: number;
  color?: string;
}

export function arrowStyles({ direction, width, height, color }: ArrowStyles) {
  const styles = {
    display: 'block',
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
  };
  switch (direction) {
    case 'up':
      return {
        ...styles,
        borderBottomColor: color,
        borderBottomWidth: height,
        borderTopWidth: 0,
        borderLeftWidth: width / 2,
        borderRightWidth: width / 2,
      };
    case 'down':
      return {
        ...styles,
        borderTopColor: color,
        borderTopWidth: height,
        borderBottomWidth: 0,
        borderLeftWidth: width / 2,
        borderRightWidth: width / 2,
      };
    case 'left':
      return {
        ...styles,
        borderRightColor: color,
        borderRightWidth: height,
        borderLeftWidth: 0,
        borderTopWidth: width / 2,
        borderBottomWidth: width / 2,
      };
    case 'right':
      return {
        ...styles,
        borderLeftColor: color,
        borderLeftWidth: height,
        borderRightWidth: 0,
        borderTopWidth: width / 2,
        borderBottomWidth: width / 2,
      };
  }
}

const Arrow = styled.span(
  ({ direction, width, height, color = 'currentColor' }: ArrowStyles) =>
    arrowStyles({ direction, width, height, color })
);

export default Arrow;
