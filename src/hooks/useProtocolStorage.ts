import { useState, useEffect } from 'react';

export interface SavedProtocol {
  id: string;
  childName: string;
  educationalOrganization: string;
  level: string;
  createdDate: string;
  lastModified: string;
  completionPercentage: number;
  status: 'draft' | 'completed';
  protocolData: any;
  checklistData: any;
  consultationType: "primary" | "secondary";
  reason: string;
  consultationDate?: string;
  decision?: string;
  recommendations?: string[];
}

export const useProtocolStorage = () => {
  const [protocols, setProtocols] = useState<SavedProtocol[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('ppk-protocols');
    if (saved) {
      setProtocols(JSON.parse(saved));
    }
  }, []);

  const saveProtocol = (protocolData: any, checklistData: any, completionPercentage: number) => {
    const protocol: SavedProtocol = {
      id: Date.now().toString(),
      childName: protocolData.childData.fullName,
      educationalOrganization: protocolData.childData.educationalOrganization || 'Не указано',
      level: checklistData.level || 'elementary',
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      completionPercentage,
      status: completionPercentage === 100 ? 'completed' : 'draft',
      protocolData,
      checklistData,
      consultationType: protocolData.consultationType,
      reason: protocolData.reason || 'Не указано',
      consultationDate: protocolData.consultationDate,
      decision: protocolData.decision,
      recommendations: protocolData.recommendations
    };

    const newProtocols = [...protocols, protocol];
    setProtocols(newProtocols);
    localStorage.setItem('ppk-protocols', JSON.stringify(newProtocols));
    return protocol.id;
  };

  const updateProtocol = (id: string, protocolData: any, checklistData: any, completionPercentage: number) => {
    const updatedProtocols = protocols.map(protocol => 
      protocol.id === id 
        ? {
            ...protocol,
            protocolData,
            checklistData,
            completionPercentage,
            status: (completionPercentage === 100 ? 'completed' : 'draft') as 'draft' | 'completed',
            lastModified: new Date().toISOString(),
            childName: protocolData.childData.fullName,
            educationalOrganization: protocolData.childData.educationalOrganization || 'Не указано',
            reason: protocolData.reason || 'Не указано',
            consultationDate: protocolData.consultationDate,
            decision: protocolData.decision,
            recommendations: protocolData.recommendations
          }
        : protocol
    );
    setProtocols(updatedProtocols);
    localStorage.setItem('ppk-protocols', JSON.stringify(updatedProtocols));
  };

  const deleteProtocol = (id: string) => {
    const filteredProtocols = protocols.filter(protocol => protocol.id !== id);
    setProtocols(filteredProtocols);
    localStorage.setItem('ppk-protocols', JSON.stringify(filteredProtocols));
  };

  const getProtocol = (id: string): SavedProtocol | undefined => {
    return protocols.find(protocol => protocol.id === id);
  };

  return {
    protocols,
    saveProtocol,
    updateProtocol,
    deleteProtocol,
    getProtocol
  };
};