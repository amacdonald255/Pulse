export const firebaseConfig = {
  apiKey: "AIzaSyBRugmltqow09PUx0rp1rDJ1s10hk4oI8",
  authDomain: "pulse-5a59e.firebaseapp.com",
  projectId: "pulse-5a59e",
  storageBucket: "pulse-5a59e.firebasestorage.app",
  messagingSenderId: "370257215223",
  appId: "1:370257215223:web:1e4194026ad3bd24529df2"
};

export function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every((value) => (
    typeof value === "string" &&
    value.trim() !== "" &&
    !value.startsWith("PASTE_FIREBASE")
  ));
}
