import React, { createContext, useContext } from 'react';
import { Container, container as defaultContainer } from '@di/container';

const ContainerContext = createContext<Container>(defaultContainer);

export function ContainerProvider({
  children,
  value = defaultContainer,
}: {
  children: React.ReactNode;
  value?: Container;
}) {
  return (
    <ContainerContext.Provider value={value}>{children}</ContainerContext.Provider>
  );
}

export const useContainer = (): Container => useContext(ContainerContext);
