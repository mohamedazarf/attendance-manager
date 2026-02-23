import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
    username: string;
    role: string;
    full_name?: string;
    email?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const isAuthenticated = !!token;
    // const isAdmin = user?.role === 'admin';
    const isAdmin = user?.role === 'admin' || (token ? JSON.parse(atob(token.split('.')[1])).role === 'admin' : false);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isAdmin }}>
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


// import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// interface User {
//     username: string;
//     role: string;
//     full_name?: string;
//     email?: string;
// }

// interface AuthContextType {
//     user: User | null;
//     token: string | null;
//     login: (token: string, userData: User) => void;
//     logout: () => void;
//     isAuthenticated: boolean;
//     isAdmin: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//     // Initialisation synchrone du Token
//     const [token, setToken] = useState<string | null>(() => {
//         return localStorage.getItem('token');
//     });

//     // Initialisation synchrone de l'Utilisateur
//     const [user, setUser] = useState<User | null>(() => {
//         const savedUser = localStorage.getItem('user');
//         if (savedUser) {
//             try {
//                 return JSON.parse(savedUser);
//             } catch (error) {
//                 console.error("Erreur de lecture de l'utilisateur stocké:", error);
//                 return null;
//             }
//         }
//         return null;
//     });

//     // Gestion de la connexion
//     const login = (newToken: string, userData: User) => {
//         setToken(newToken);
//         setUser(userData);
//         localStorage.setItem('token', newToken);
//         localStorage.setItem('user', JSON.stringify(userData));
//     };

//     // Gestion de la déconnexion
//     const logout = () => {
//         setToken(null);
//         setUser(null);
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//     };

//     // États dérivés calculés instantanément
//     const isAuthenticated = !!token;

//     // Vérification robuste du rôle Admin (insensible à la casse)
//     const isAdmin = user?.role === 'admin' || (token ? JSON.parse(atob(token.split('.')[1])).role === 'admin' : false);

//     return (
//         <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isAdmin }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// // Hook personnalisé pour utiliser le contexte
// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (context === undefined) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };