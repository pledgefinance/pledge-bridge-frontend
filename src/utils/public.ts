import BigNumber from 'bignumber.js';

export const multiplied_18 = (num: BigNumber.Value) => {
  if (!num) return undefined;
  const x = new BigNumber(num);
  const y = new BigNumber(1e18);
  return x.multipliedBy(y).toFixed();
};

export const divided_18 = (num: BigNumber.Value) => {
  if (!num) return undefined;
  const x = new BigNumber(num);
  const y = new BigNumber(1e18);
  return x.dividedBy(y).toFixed();
};
