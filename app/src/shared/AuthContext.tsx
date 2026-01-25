import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  // Potentially add error state here later
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({children}: AuthProviderProps) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        // User is signed in
        setUser(firebaseUser);
      } else {
        // No user is signed in, sign in anonymously
        try {
          const anonymousUserCredential = await auth().signInAnonymously();
          setUser(anonymousUserCredential.user);
        } catch (error) {
          console.error('Anonymous sign-in failed', error);
          // Handle error, maybe set an error state
        }
      }
      setLoading(false);
    });

    // Unsubscribe from events when no longer in use
    return subscriber;
  }, []);

  return (
    <AuthContext.Provider value={{user, loading}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
