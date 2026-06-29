import React, { useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { City, formatCityLabel } from '@domain/entities/City';
import { useCitySearch } from '@presentation/hooks/useCitySearch';
import { useDeviceCity } from '@presentation/hooks/useDeviceCity';
import { useDebouncedValue } from '@presentation/hooks/useDebouncedValue';
import { useSelectionStore } from '@presentation/stores/useSelectionStore';
import { Screen } from '@presentation/components/Screen';
import { Display, Body, Caption, Title, Eyebrow } from '@presentation/components/Text';
import { Card } from '@presentation/components/Pressable';
import { LoadingView, EmptyView, ErrorView } from '@presentation/components/StateViews';
import { RootStackParamList } from '@presentation/navigation/types';
import { AppTheme, theme as appTheme } from '@presentation/theme/theme';

const Header = styled.View`
  padding: ${({ theme }) => theme.spacing(5)}px;
  padding-bottom: ${({ theme }) => theme.spacing(2)}px;
`;

const InputRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing(4)}px;
  gap: ${({ theme }) => theme.spacing(2)}px;
`;

const Input = styled.TextInput.attrs({
  placeholderTextColor: appTheme.colors.textMuted,
})`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSize.md}px;
  padding: ${({ theme }) => theme.spacing(4)}px;
`;

const LocationButton = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing(4)}px;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  min-height: 52px;
`;

const Spacer = styled.View`
  height: ${({ theme }) => theme.spacing(3)}px;
`;

type Nav = NativeStackNavigationProp<RootStackParamList, 'Search'>;

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 350);
  const navigation = useNavigation<Nav>();
  const theme = useTheme() as AppTheme;
  const setCity = useSelectionStore((s) => s.setCity);
  const { data, isFetching, isError, error, refetch } = useCitySearch(debouncedQuery);
  const { detectCity, isLoading: isDetecting, error: locationError } = useDeviceCity();

  const onSelect = (city: City) => {
    setCity(city);
    navigation.navigate('Recommendation');
  };

  const onUseLocation = async () => {
    const city = await detectCity();
    if (city) onSelect(city);
  };

  return (
    <Screen>
      <Header>
        <Eyebrow>testeTecnico</Eyebrow>
        <Display>Qual é o seu plano lá fora?</Display>
        <Body style={{ marginTop: 8 }}>
          Busque sua cidade e descubra a melhor janela do dia.
        </Body>
        <InputRow>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Ex.: Rio de Janeiro"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Buscar cidade"
          />
          <LocationButton
            onPress={onUseLocation}
            disabled={isDetecting}
            accessibilityRole="button"
            accessibilityLabel="Usar minha localização atual"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isDetecting ? (
              <ActivityIndicator size="small" color={theme.colors.amber} />
            ) : (
              <Ionicons name="location-outline" size={22} color={theme.colors.amber} />
            )}
          </LocationButton>
        </InputRow>
      </Header>

      {locationError && query.trim().length < 2 ? (
        <EmptyView title="Localização indisponível" hint={locationError} />
      ) : query.trim().length < 2 ? (
        <EmptyView title="Comece pela cidade" hint="Digite ao menos duas letras." />
      ) : query.trim() !== debouncedQuery || isFetching ? (
        <LoadingView label="Procurando cidades…" />
      ) : isError ? (
        <ErrorView message={(error as Error).message} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyView title="Nenhuma cidade encontrada" hint="Confira a grafia e tente de novo." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ padding: 20 }}
          ItemSeparatorComponent={Spacer}
          renderItem={({ item }) => (
            <Card
              onPress={() => onSelect(item)}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar ${formatCityLabel(item)}`}
            >
              <Title>{item.name}</Title>
              <Caption>{formatCityLabel(item)}</Caption>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
