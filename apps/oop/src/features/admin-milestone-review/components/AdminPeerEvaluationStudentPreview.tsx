import {
  Badge,
  Button,
  Card,
  Heading,
  Text,
  TextArea,
  TextInput,
} from '@aics/design-system';

import {
  peerEvaluationProjectQuestions,
  peerEvaluationTeammateQuestions,
} from '~/course/peerEvaluationQuestions';

import * as styles from './AdminPeerEvaluationStudentPreview.css';

export default function AdminPeerEvaluationStudentPreview() {
  return (
    <section
      aria-labelledby='peer-evaluation-student-preview'
      className={styles.root}
    >
      <header className={styles.header}>
        <div>
          <Heading id='peer-evaluation-student-preview' level={2}>
            학생 상호평가 문항 · 학생 화면 미리보기
          </Heading>
          <Text color='secondary' type='supporting'>
            상호평가는 고정 양식입니다. 실제 학생 제출 내용은 표시하지 않는 읽기
            전용 예시입니다.
          </Text>
        </div>
        <Badge label='읽기 전용' variant='neutral' />
      </header>

      <Card className={styles.preview} padding={3}>
        <section
          aria-labelledby='peer-project-evaluation'
          className={styles.step}
        >
          <div className={styles.stepHeader}>
            <Text color='secondary' type='supporting'>
              1단계
            </Text>
            <Heading id='peer-project-evaluation' level={3}>
              프로젝트 평가
            </Heading>
            <Text color='secondary' type='supporting'>
              자신의 역할과 프로젝트 경험을 간단히 작성합니다.
            </Text>
          </div>
          <div className={styles.fields}>
            {peerEvaluationProjectQuestions.map(question => (
              <TextArea
                description={question.description}
                isDisabled
                isRequired
                key={question.label}
                label={question.label}
                onChange={() => undefined}
                placeholder='학생이 입력하는 영역'
                rows={2}
                value=''
                width='100%'
              />
            ))}
          </div>
        </section>

        <section
          aria-labelledby='peer-teammate-evaluation'
          className={styles.step}
        >
          <div className={styles.stepHeader}>
            <Text color='secondary' type='supporting'>
              2단계
            </Text>
            <Heading id='peer-teammate-evaluation' level={3}>
              팀원 기여도 평가
            </Heading>
            <Text color='secondary' type='supporting'>
              본인을 제외한 팀원에게 기여도 합계 100%를 배분합니다.
            </Text>
          </div>
          <div className={styles.teammatePreview}>
            <div className={styles.teammateHeader}>
              <div>
                <Text weight='medium'>팀원 평가 입력 예시</Text>
                <Text color='secondary' type='supporting'>
                  실제 학생 화면에서는 팀원별로 이 입력 창을 엽니다.
                </Text>
              </div>
              <Badge label='미작성' variant='neutral' />
            </div>
            <div className={styles.fields}>
              <TextInput
                description='0~100 사이 정수'
                isDisabled
                isRequired
                label={peerEvaluationTeammateQuestions[0].label}
                onChange={() => undefined}
                placeholder='0'
                value=''
                width='100%'
              />
              <TextArea
                description={peerEvaluationTeammateQuestions[1].description}
                isDisabled
                isRequired
                label={peerEvaluationTeammateQuestions[1].label}
                onChange={() => undefined}
                placeholder='학생이 입력하는 영역'
                rows={2}
                value=''
                width='100%'
              />
              <TextArea
                description={peerEvaluationTeammateQuestions[2].description}
                isDisabled
                isRequired
                label={peerEvaluationTeammateQuestions[2].label}
                onChange={() => undefined}
                placeholder='학생이 입력하는 영역'
                rows={2}
                value=''
                width='100%'
              />
            </div>
          </div>
          <div className={styles.stepFooter}>
            <Text weight='medium'>기여도 합계 0%</Text>
            <Badge label='100% 필요' variant='neutral' />
          </div>
        </section>

        <div className={styles.actions}>
          <Button isDisabled label='이전 설문' variant='secondary' />
          <Button isDisabled label='제출하기' variant='primary' />
        </div>
      </Card>
    </section>
  );
}
