const left = 3;
const right = -4;
const MASKED_CHAR = "X";

export const maskMobileNo = (mobileNo) => {
  const maskStr = mobileNo.replace(/-/g, "");
  const leftStr = maskStr.slice(0, left);
  const rightStr = maskStr.slice(right);
  const maskedC = MASKED_CHAR;
  const strLen = maskStr.length;
  const leftStrLen = leftStr.length;
  const rightStrLen = rightStr.length;
  let maskedCharLen = strLen - (leftStrLen + rightStrLen);
  if(isNaN(maskedCharLen) || maskedCharLen < 0)
    maskedCharLen = 0;
  const newStr = leftStr + maskedC.repeat(maskedCharLen) + rightStr;
  console.log(newStr, "nnnnnn");
  return newStr;
};

export const formatErrorObject = (error) => {
  return {
    ...(error?.code && { code: error?.code }),
    ...(error?.statusCode && { statusCode: error?.statusCode }),
    ...(error?.message && { message: error?.message }),
    ...(error?.status && { status: error?.status }),
  };
};

export const getCurrentDateFormatted = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};
