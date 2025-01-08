import React, { useState } from 'react'
import styled from 'styled-components'

import {   Logo_green } from '../../config/icons'
import { useQuiz } from '../../context/QuizContext'
import {
  CenterCardContainer,
  HighlightedText,
  LogoContainer,
  PageCenter,
} from '../../styles/Global'
import { ScreenTypes } from '../../types'

import Button from '../ui/Button'

// Styled Components for the form
const FormContainer = styled.div`
  width: 50%;
  margin-top: 20px;
`

const FormGroup = styled.div`
  margin-bottom: 15px;
`

const InputLabel = styled.label`
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 5px;
  display: block;
`

const InputField = styled.input`
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.disabledButton};
  font-size: 16px;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.themeColor};
  }
`

// Heading and DetailText as before
const Heading = styled.h2`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
`

const DetailText = styled.p`
  font-weight: 500;
  font-size: 20px;
  line-height: 29px;
  text-align: center;
`

const QuizTopicsScreen: React.FC = () => {
  const { setCurrentScreen } = useQuiz()

  // Set the default quiz topic to "JavaScript" (no need for selection)
  const quizTopic = "JavaScript"

  // State for form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    
    phone: '',
  })

  // Check if all fields are filled
  const isFormValid =
    formData.name &&
    formData.email &&
    formData.company &&
    
    formData.phone

  const goToQuizDetailsScreen = () => {
    if (isFormValid) {
      setCurrentScreen(ScreenTypes.QuizDetailsScreen)
    } else {
      // Optionally, display an alert or message if form is incomplete
      alert('Please fill out all fields before continuing.')
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  return (
    <PageCenter light justifyCenter>
      <CenterCardContainer>
        <LogoContainer>
          <Logo_green />
        </LogoContainer>
        <Heading>
          WELCOME TO <HighlightedText> Lube Buzz Quiz</HighlightedText>
        </Heading>
        
        
        {/* Form for user details */}
        <FormContainer>
          <FormGroup>
            <InputLabel htmlFor="name">Name</InputLabel>
            <InputField
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your name"
            />
          </FormGroup>
          <FormGroup>
            <InputLabel htmlFor="email">Email</InputLabel>
            <InputField
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
            />
          </FormGroup>
          <FormGroup>
            <InputLabel htmlFor="company">Company</InputLabel>
            <InputField
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Enter your company"
            />
          </FormGroup>
          
          <FormGroup>
            <InputLabel htmlFor="phone">Phone Number</InputLabel>
            <InputField
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
            />
          </FormGroup>
        </FormContainer>

        {/* Continue button */}
        <Button
          text="Continue"
          onClick={goToQuizDetailsScreen}
          bold
          disabled={!isFormValid} // Disable button if form is not valid
        />
      </CenterCardContainer>
    </PageCenter>
  )
}

export default QuizTopicsScreen
