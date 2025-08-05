import { useState, useEffect } from 'react';

export interface SavedProtocol {
  id: string;
  childData: {
    lastName: string;
    firstName: string;
    middleName: string;
    birthDate: string;
    address: string;
    registrationAddress: string;
    registrationSameAsAddress: boolean;
    parentName: string;
    parentPhone: string;
  };
  documents: Array<{
    id: string;
    name: string;
    present: boolean;
  }>;
  educationLevel?: "preschool" | "elementary" | "middle" | "high";
  checklistData?: any[];
  isCompleted: boolean;
  lastModified: Date;
  createdAt: Date;
}

export const useProtocolStorage = () => {
  const [savedProtocols, setSavedProtocols] = useState<SavedProtocol[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('savedProtocols');
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((protocol: any) => ({
          ...protocol,
          lastModified: new Date(protocol.lastModified),
          createdAt: new Date(protocol.createdAt)
        }));
        setSavedProtocols(parsed);
      } catch (error) {
        console.error('Error parsing saved protocols:', error);
      }
    }
  }, []);

  const saveProtocol = (protocol: Omit<SavedProtocol, 'id' | 'lastModified' | 'createdAt'>) => {
    const newProtocol: SavedProtocol = {
      ...protocol,
      id: Date.now().toString(),
      lastModified: new Date(),
      createdAt: new Date()
    };

    const updatedProtocols = [...savedProtocols, newProtocol];
    setSavedProtocols(updatedProtocols);
    localStorage.setItem('savedProtocols', JSON.stringify(updatedProtocols));
    return newProtocol.id;
  };

  const updateProtocol = (id: string, updates: Partial<SavedProtocol>) => {
    const updatedProtocols = savedProtocols.map(protocol =>
      protocol.id === id
        ? { ...protocol, ...updates, lastModified: new Date() }
        : protocol
    );
    setSavedProtocols(updatedProtocols);
    localStorage.setItem('savedProtocols', JSON.stringify(updatedProtocols));
  };

  const deleteProtocol = (id: string) => {
    const updatedProtocols = savedProtocols.filter(protocol => protocol.id !== id);
    setSavedProtocols(updatedProtocols);
    localStorage.setItem('savedProtocols', JSON.stringify(updatedProtocols));
  };

  const getProtocol = (id: string) => {
    return savedProtocols.find(protocol => protocol.id === id);
  };

  return {
    savedProtocols,
    saveProtocol,
    updateProtocol,
    deleteProtocol,
    getProtocol
  };
};