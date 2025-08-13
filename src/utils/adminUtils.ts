export const ADMIN_EMAIL = "leocheewee@gmail.com";

export const isAdmin = (userEmail: string | undefined): boolean => {
  return userEmail === ADMIN_EMAIL;
};