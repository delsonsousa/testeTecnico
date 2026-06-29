import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { formatCityLabel } from '@domain/entities/City';
import { useSelectionStore } from '@presentation/stores/useSelectionStore';
import { useActivities } from '@presentation/hooks/useActivities';
import { useRecommendation } from '@presentation/hooks/useRecommendation';
import { Screen } from '@presentation/components/Screen';
import { Display, Caption, Eyebrow, Body } from '@presentation/components/Text';
import { ActivityChips } from '@presentation/components/ActivityChips';
import { RecommendationCard } from '@presentation/components/RecommendationCard';
import { HourTimeline } from '@presentation/components/HourTimeline';
import { LoadingView, ErrorView, EmptyView } from '@presentation/components/StateViews';
import { RootStackParamList } from '@presentation/navigation/types';

const Header = styled.View`
  padding: ${({ theme }) => theme.spacing(5)}px;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
`;

const HeaderAction = styled.Pressable`
  min-height: 44px;
  justify-content: center;
`;

const Link = styled.Text`
  color: ${({ theme }) => theme.colors.amber};
  font-weight: 700;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
`;

const TextButton = styled.Pressable`
  align-self: flex-start;
  margin-top: ${({ theme }) => theme.spacing(3)}px;
  min-height: 44px;
  justify-content: center;
`;

const Section = styled.View`
  padding-horizontal: ${({ theme }) => theme.spacing(5)}px;
  margin-bottom: ${({ theme }) => theme.spacing(5)}px;
`;

type Nav = NativeStackNavigationProp<RootStackParamList, 'Recommendation'>;

export function RecommendationScreen() {
  const navigation = useNavigation<Nav>();
  const city = useSelectionStore((s) => s.city);
  const activityId = useSelectionStore((s) => s.activityId);
  const setActivityId = useSelectionStore((s) => s.setActivityId);

  const { data: activities } = useActivities();
  const activity = useMemo(
    () => activities?.find((a) => a.id === activityId) ?? activities?.[0] ?? null,
    [activities, activityId],
  );

  const { data, isFetching, isError, error, refetch } = useRecommendation(
    city,
    activity,
  );

  if (!city) {
    return (
      <Screen>
        <EmptyView title="Escolha uma cidade primeiro" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header>
          <View>
            <Eyebrow>Hoje em</Eyebrow>
            <Display>{city.name}</Display>
            <Caption>{formatCityLabel(city)}</Caption>
          </View>
          <HeaderAction
            onPress={() => navigation.navigate('Search')}
            accessibilityRole="button"
            accessibilityLabel="Trocar cidade"
          >
            <Link>Trocar</Link>
          </HeaderAction>
        </Header>

        <Section>
          <ActivityChips
            activities={activities ?? []}
            selectedId={activity?.id ?? null}
            onSelect={setActivityId}
          />
          <TextButton
            onPress={() => navigation.navigate('Activities')}
            accessibilityRole="button"
            accessibilityLabel="Gerenciar atividades"
          >
            <Body style={{ color: '#B5C0C2', fontSize: 13 }}>
              + Gerenciar atividades
            </Body>
          </TextButton>
        </Section>

        {isFetching ? (
          <LoadingView />
        ) : isError ? (
          <ErrorView message={(error as Error).message} onRetry={refetch} />
        ) : data && activity ? (
          <>
            <Section>
              <RecommendationCard recommendation={data} activity={activity} />
            </Section>
            <Section>
              <HourTimeline hours={data.scoredHours} bestWindow={data.bestWindow} />
            </Section>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const View = styled.View``;
