import styled from 'styled-components'

import { Logo_green, StartIcon } from '../../config/icons'
import { useQuiz } from '../../context/QuizContext'
import {
  CenterCardContainer,
  LogoContainer,
  PageCenter,
} from '../../styles/Global'
import { ScreenTypes } from '../../types'

import Button from '../ui/Button'

const AppTitle = styled.h2`
  font-weight: 700;
  font-size: 32px;
  color: ${({ theme }) => theme.colors.themeColor};
`
const StyledComponent = styled.div`
  font-weight: 600;
  font-size: 24px;
  color: ${({ theme }) => theme.colors.primaryText}; // Use an existing property
  text-align: left;
  margin-bottom: 10px;
`;



const InstructionHeading = styled.h3`
  font-weight: 600;
  font-size: 24px;
  color: ${({ theme }) => theme.colors.text};
  text-align: left;
  margin-bottom: 10px;
`

const InstructionsContainer = styled.div`
  font-size: 20px;
  font-weight: 500;
  margin-top: 15px;
  margin-bottom: 40px;
  text-align: left;
  max-width: 500px;
`

const InstructionParagraph = styled.p`
  font-size: 18px;
  font-weight: 400;
  margin-top: 10px;
  margin-bottom: 10px;
  text-align: justify;
  line-height: 1.5;
`

const QuizDetailsScreen = () => {
  const { setCurrentScreen, quizDetails } = useQuiz()

  const { selectedQuizTopic, totalQuestions, totalScore, totalTime } = quizDetails

  const goToQuestionScreen = () => {
    setCurrentScreen(ScreenTypes.QuestionScreen)
  }

  return (
    <PageCenter light justifyCenter>
      <CenterCardContainer>
        <LogoContainer>
          <Logo_green />
        </LogoContainer>
        <AppTitle>Lube Buzz Quiz</AppTitle>
        <InstructionsContainer>
          <InstructionHeading>Instructions -</InstructionHeading>
          <InstructionParagraph>
            1. Answer 10 questions in 2 minutes. For each correct answer, you will get 10 points. For wrong answers, no negative markings.
          </InstructionParagraph>
          <InstructionParagraph>
            2. In case you do not clear in 1st attempt, you may again take the quiz.
          </InstructionParagraph>
          <InstructionParagraph>
            3. The passing score is 60%. If you secure it or more, you will get a FREE certificate that is downloadable and shareable.
          </InstructionParagraph>
          <InstructionParagraph>
            4. Share your certificate on LinkedIn and tag us to win exciting prizes. Do not forget to use our hashtags #MSPLQuizAlert #TheLubeBuzzQuiz2025
          </InstructionParagraph>
          <InstructionParagraph>
            5. For any further clarification or concern, write to us at - info@minimac.in
          </InstructionParagraph>
        </InstructionsContainer>
        <Button
          text="Start"
          icon={<StartIcon />}
          iconPosition="left"
          onClick={goToQuestionScreen}
          bold
        />
      </CenterCardContainer>
    </PageCenter>
  )
}

export default QuizDetailsScreen
