/**
 *
 * @param length default value is 4
 * @param type 'numeric' | 'alphanumeric'. Default alphanumeric
 * @returns alpha-numeric value
 */
type OTPType = 'numeric' | 'alphanumeric';

const uid = (length = 11, type: OTPType = 'alphanumeric') => {
  let otp = '';
  if (type == 'numeric') {
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
  } else {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.toLowerCase();

    for (let i = 0; i < length; i++) {
      const index = Math.floor(Math.random() * characters.length);
      otp += characters[index];
    }
  }

  return otp;
};

export { uid };
