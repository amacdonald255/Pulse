export const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY_HERE",
  authDomain: "PASTE_FIREBASE_AUTH_DOMAIN_HERE",
  projectId: "PASTE_FIREBASE_PROJECT_ID_HERE",
  storageBucket: "PASTE_FIREBASE_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_FIREBASE_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_FIREBASE_APP_ID_HERE"
};

export function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every((value) => (
    typeof value === "string" &&
    value.trim() !== "" &&
    !value.startsWith("PASTE_FIREBASE")
  ));
}
