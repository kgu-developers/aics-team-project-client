import { Heading, Text } from '@aics/design-system';

import { useAdminTeamEvaluationCriteriaQuery } from '../queries';
import * as styles from './AdminPresentationEvaluationQuestions.css';

export type PresentationEvaluationSection = {
  code: string;
  id: string;
  name: string;
};

function PresentationEvaluationCriteriaList({
  section,
}: {
  section: PresentationEvaluationSection;
}) {
  const criteriaQuery = useAdminTeamEvaluationCriteriaQuery(section.id);

  return (
    <article className={styles.sectionCard}>
      <Heading className={styles.sectionTitle} level={3}>
        {`${section.code} · ${section.name}`}
      </Heading>
      {criteriaQuery.isPending ? (
        <Text aria-live='polite' role='status'>
          학생 발표 평가 문항을 불러오는 중입니다.
        </Text>
      ) : criteriaQuery.isError ? (
        <Text role='alert'>
          학생 발표 평가 문항을 불러오지 못했습니다. 제출·평가 현황의 발표 평가
          화면에서 다시 확인해 주세요.
        </Text>
      ) : (criteriaQuery.data?.contents.length ?? 0) === 0 ? (
        <Text color='secondary' type='supporting'>
          아직 등록된 발표 평가 문항이 없습니다. 제출·평가 현황의 발표 평가에서
          문항을 추가하면 학생 발표 평가 화면에도 표시됩니다.
        </Text>
      ) : (
        <ol className={styles.criteriaList}>
          {criteriaQuery.data?.contents.map(criterion => (
            <li key={criterion.id}>
              <Text weight='medium'>
                {criterion.title} · {criterion.maxScore}점
              </Text>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

export default function AdminPresentationEvaluationQuestions({
  sections,
}: {
  sections: readonly PresentationEvaluationSection[];
}) {
  return (
    <section
      aria-labelledby='presentation-evaluation-questions'
      className={styles.root}
    >
      <Heading id='presentation-evaluation-questions' level={2}>
        학생 발표 평가 문항
      </Heading>
      <Text className={styles.description} color='secondary' type='supporting'>
        발표 평가 문항은 제출·평가 현황의 발표 평가에서 설정합니다. 아래 문항은
        학생 발표 평가 화면에 동일하게 표시됩니다.
      </Text>
      {sections.length === 0 ? (
        <Text color='secondary' type='supporting'>
          문항을 확인할 분반을 하나 이상 선택해 주세요.
        </Text>
      ) : (
        <div className={styles.sectionList}>
          {sections.map(section => (
            <PresentationEvaluationCriteriaList
              key={section.id}
              section={section}
            />
          ))}
        </div>
      )}
    </section>
  );
}
