import React from 'react';
import { StatusBar } from 'expo-status-bar';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Root = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.night};
`;

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <Root edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      {children}
    </Root>
  );
}
