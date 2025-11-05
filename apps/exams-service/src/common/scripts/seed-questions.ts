import { PrismaClient, QuestionType, QuestionDifficulty } from '@prisma/exams-client'
import { config } from 'dotenv'
config()

const prisma = new PrismaClient({
  datasourceUrl: process.env.EXAMS_DATABASE_URL,
})

// Categories data
const categories = [
  { name: 'OOP', description: 'Object-Oriented Programming concepts and principles' },
  { name: 'HTML', description: 'HyperText Markup Language for web structure' },
  { name: 'CSS', description: 'Cascading Style Sheets for web styling' },
  { name: 'JavaScript', description: 'JavaScript programming language' },
  { name: 'PHP', description: 'PHP: Hypertext Preprocessor server-side scripting' },
  { name: 'Java', description: 'Java programming language' },
  { name: 'C', description: 'C programming language' },
  { name: 'C++', description: 'C++ programming language' },
]

// Sample questions data
const questionsData = [
  // OOP Questions
  {
    content: "What is the main principle of Object-Oriented Programming?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "OOP",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Encapsulation, Inheritance, Polymorphism, Abstraction', is_correct: true },
        { id: 'b', text: 'Only Inheritance and Polymorphism', is_correct: false },
        { id: 'c', text: 'Only Encapsulation', is_correct: false },
        { id: 'd', text: 'Procedural programming concepts', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the difference between inheritance and composition in OOP. Provide examples for each.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "OOP",
    is_public: true
  },
  {
    content: "Which of the following are pillars of OOP? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "OOP",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Encapsulation', is_correct: true },
        { id: 'b', text: 'Inheritance', is_correct: true },
        { id: 'c', text: 'Polymorphism', is_correct: true },
        { id: 'd', text: 'Compilation', is_correct: false },
        { id: 'e', text: 'Abstraction', is_correct: true }
      ]
    }
  },
  {
    content: "What is method overloading?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "OOP",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Using the same method name with different parameters', is_correct: true },
        { id: 'b', text: 'Using different method names with same parameters', is_correct: false },
        { id: 'c', text: 'Creating multiple classes', is_correct: false },
        { id: 'd', text: 'Inheriting from multiple classes', is_correct: false }
      ]
    }
  },
  {
    content: "Design a class hierarchy for a Vehicle system including Car, Motorcycle, and Truck. Show the relationships and explain your design choices.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "OOP",
    is_public: true
  },

  // HTML Questions
  {
    content: "What does HTML stand for?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'HyperText Markup Language', is_correct: true },
        { id: 'b', text: 'High Tech Modern Language', is_correct: false },
        { id: 'c', text: 'Home Tool Markup Language', is_correct: false },
        { id: 'd', text: 'Hyperlink and Text Markup Language', is_correct: false }
      ]
    }
  },
  {
    content: "Which HTML tag is used for the largest heading?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: '<h1>', is_correct: true },
        { id: 'b', text: '<h6>', is_correct: false },
        { id: 'c', text: '<heading>', is_correct: false },
        { id: 'd', text: '<header>', is_correct: false }
      ]
    }
  },
  {
    content: "Create a complete HTML document structure for a simple blog post page including meta tags, title, and proper semantic elements.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "HTML",
    is_public: true
  },
  {
    content: "Which HTML5 semantic elements are used for page structure? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "HTML",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: '<header>', is_correct: true },
        { id: 'b', text: '<nav>', is_correct: true },
        { id: 'c', text: '<section>', is_correct: true },
        { id: 'd', text: '<div>', is_correct: false },
        { id: 'e', text: '<footer>', is_correct: true }
      ]
    }
  },
  {
    content: "What is the difference between block and inline elements in HTML?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Block elements take full width, inline elements only take necessary width', is_correct: true },
        { id: 'b', text: 'Inline elements take full width, block elements only take necessary width', is_correct: false },
        { id: 'c', text: 'There is no difference', is_correct: false },
        { id: 'd', text: 'Block elements are faster to load', is_correct: false }
      ]
    }
  },

  // CSS Questions
  {
    content: "What does CSS stand for?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "CSS",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Cascading Style Sheets', is_correct: true },
        { id: 'b', text: 'Computer Style Sheets', is_correct: false },
        { id: 'c', text: 'Creative Style Sheets', is_correct: false },
        { id: 'd', text: 'Colorful Style Sheets', is_correct: false }
      ]
    }
  },
  {
    content: "Which CSS property is used to change the text color?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "CSS",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'color', is_correct: true },
        { id: 'b', text: 'text-color', is_correct: false },
        { id: 'c', text: 'font-color', is_correct: false },
        { id: 'd', text: 'text-style', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the CSS Box Model and its components. How does it affect element sizing?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "CSS",
    is_public: true
  },
  {
    content: "Which CSS display values make an element behave as a block? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "CSS",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'block', is_correct: true },
        { id: 'b', text: 'inline-block', is_correct: false },
        { id: 'c', text: 'flex', is_correct: true },
        { id: 'd', text: 'grid', is_correct: true },
        { id: 'e', text: 'inline', is_correct: false }
      ]
    }
  },
  {
    content: "What is the difference between position: relative and position: absolute?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "CSS",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Relative positions relative to its normal position, absolute positions relative to nearest positioned ancestor', is_correct: true },
        { id: 'b', text: 'Absolute positions relative to its normal position, relative positions relative to nearest positioned ancestor', is_correct: false },
        { id: 'c', text: 'Both work the same way', is_correct: false },
        { id: 'd', text: 'Relative is faster than absolute', is_correct: false }
      ]
    }
  },

  // JavaScript Questions
  {
    content: "What is the correct syntax for creating a function in JavaScript?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "JavaScript",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'function myFunction() {}', is_correct: true },
        { id: 'b', text: 'create myFunction() {}', is_correct: false },
        { id: 'c', text: 'function = myFunction() {}', is_correct: false },
        { id: 'd', text: 'def myFunction() {}', is_correct: false }
      ]
    }
  },
  {
    content: "Which of the following are JavaScript data types? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "JavaScript",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'String', is_correct: true },
        { id: 'b', text: 'Number', is_correct: true },
        { id: 'c', text: 'Boolean', is_correct: true },
        { id: 'd', text: 'Character', is_correct: false },
        { id: 'e', text: 'Object', is_correct: true }
      ]
    }
  },
  {
    content: "Explain the difference between var, let, and const in JavaScript. Provide examples of when to use each.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "JavaScript",
    is_public: true
  },
  {
    content: "What is closure in JavaScript?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.hard,
    category: "JavaScript",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'A function that has access to variables in its outer scope even after the outer function returns', is_correct: true },
        { id: 'b', text: 'A way to close browser windows', is_correct: false },
        { id: 'c', text: 'A method to end program execution', is_correct: false },
        { id: 'd', text: 'A type of loop in JavaScript', is_correct: false }
      ]
    }
  },
  {
    content: "What will console.log(typeof null) output?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "JavaScript",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'object', is_correct: true },
        { id: 'b', text: 'null', is_correct: false },
        { id: 'c', text: 'undefined', is_correct: false },
        { id: 'd', text: 'string', is_correct: false }
      ]
    }
  },

  // PHP Questions
  {
    content: "What does PHP stand for?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "PHP",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'PHP: Hypertext Preprocessor', is_correct: true },
        { id: 'b', text: 'Personal Home Page', is_correct: false },
        { id: 'c', text: 'Private Home Page', is_correct: false },
        { id: 'd', text: 'Professional Hypertext Processor', is_correct: false }
      ]
    }
  },
  {
    content: "Which symbol is used to start a variable in PHP?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "PHP",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: '$', is_correct: true },
        { id: 'b', text: '#', is_correct: false },
        { id: 'c', text: '@', is_correct: false },
        { id: 'd', text: '&', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the difference between include, require, include_once, and require_once in PHP.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "PHP",
    is_public: true
  },
  {
    content: "Which PHP functions are used for array manipulation? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "PHP",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'array_push()', is_correct: true },
        { id: 'b', text: 'array_pop()', is_correct: true },
        { id: 'c', text: 'array_merge()', is_correct: true },
        { id: 'd', text: 'string_replace()', is_correct: false },
        { id: 'e', text: 'array_filter()', is_correct: true }
      ]
    }
  },
  {
    content: "What is the difference between == and === in PHP?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "PHP",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: '== compares values, === compares values and types', is_correct: true },
        { id: 'b', text: '=== compares values, == compares values and types', is_correct: false },
        { id: 'c', text: 'Both work the same way', is_correct: false },
        { id: 'd', text: '== is faster than ===', is_correct: false }
      ]
    }
  },

  // Java Questions
  {
    content: "Which keyword is used to create a class in Java?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "Java",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'class', is_correct: true },
        { id: 'b', text: 'Class', is_correct: false },
        { id: 'c', text: 'create', is_correct: false },
        { id: 'd', text: 'new', is_correct: false }
      ]
    }
  },
  {
    content: "What is the entry point of a Java application?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "Java",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'public static void main(String[] args)', is_correct: true },
        { id: 'b', text: 'public void start()', is_correct: false },
        { id: 'c', text: 'public static void begin()', is_correct: false },
        { id: 'd', text: 'public void main()', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the concept of garbage collection in Java and how it works.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "Java",
    is_public: true
  },
  {
    content: "Which Java access modifiers control visibility? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "Java",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'public', is_correct: true },
        { id: 'b', text: 'private', is_correct: true },
        { id: 'c', text: 'protected', is_correct: true },
        { id: 'd', text: 'package-private (default)', is_correct: true },
        { id: 'e', text: 'global', is_correct: false }
      ]
    }
  },
  {
    content: "What is the difference between ArrayList and LinkedList in Java?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "Java",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'ArrayList uses array internally, LinkedList uses doubly linked list', is_correct: true },
        { id: 'b', text: 'LinkedList uses array internally, ArrayList uses doubly linked list', is_correct: false },
        { id: 'c', text: 'Both use the same internal structure', is_correct: false },
        { id: 'd', text: 'ArrayList is always faster than LinkedList', is_correct: false }
      ]
    }
  },

  // C Questions
  {
    content: "Who developed the C programming language?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "C",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Dennis Ritchie', is_correct: true },
        { id: 'b', text: 'Bjarne Stroustrup', is_correct: false },
        { id: 'c', text: 'James Gosling', is_correct: false },
        { id: 'd', text: 'Linus Torvalds', is_correct: false }
      ]
    }
  },
  {
    content: "Which header file is required for input/output operations in C?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "C",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'stdio.h', is_correct: true },
        { id: 'b', text: 'iostream.h', is_correct: false },
        { id: 'c', text: 'conio.h', is_correct: false },
        { id: 'd', text: 'stdlib.h', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the difference between stack and heap memory allocation in C. When would you use each?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "C",
    is_public: true
  },
  {
    content: "Which functions are used for dynamic memory allocation in C? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'malloc()', is_correct: true },
        { id: 'b', text: 'calloc()', is_correct: true },
        { id: 'c', text: 'realloc()', is_correct: true },
        { id: 'd', text: 'free()', is_correct: true },
        { id: 'e', text: 'alloc()', is_correct: false }
      ]
    }
  },
  {
    content: "What is a pointer in C?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'A variable that stores the memory address of another variable', is_correct: true },
        { id: 'b', text: 'A variable that stores the value of another variable', is_correct: false },
        { id: 'c', text: 'A function that points to memory', is_correct: false },
        { id: 'd', text: 'A data type in C', is_correct: false }
      ]
    }
  },

  // C++ Questions
  {
    content: "Who developed C++?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "C++",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Bjarne Stroustrup', is_correct: true },
        { id: 'b', text: 'Dennis Ritchie', is_correct: false },
        { id: 'c', text: 'James Gosling', is_correct: false },
        { id: 'd', text: 'Ken Thompson', is_correct: false }
      ]
    }
  },
  {
    content: "Which header file is required for input/output streams in C++?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "C++",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'iostream', is_correct: true },
        { id: 'b', text: 'stdio.h', is_correct: false },
        { id: 'c', text: 'conio.h', is_correct: false },
        { id: 'd', text: 'fstream', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the concept of virtual functions in C++ and when they are used.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "C++",
    is_public: true
  },
  {
    content: "Which features are specific to C++ compared to C? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C++",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Classes and Objects', is_correct: true },
        { id: 'b', text: 'Function Overloading', is_correct: true },
        { id: 'c', text: 'Operator Overloading', is_correct: true },
        { id: 'd', text: 'Pointers', is_correct: false },
        { id: 'e', text: 'Templates', is_correct: true }
      ]
    }
  },
  {
    content: "What is the difference between public, private, and protected access specifiers in C++?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C++",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Public: accessible from anywhere, Private: only within class, Protected: within class and derived classes', is_correct: true },
        { id: 'b', text: 'Private: accessible from anywhere, Public: only within class, Protected: within class and derived classes', is_correct: false },
        { id: 'c', text: 'All three work the same way', is_correct: false },
        { id: 'd', text: 'Public is fastest, private is slowest', is_correct: false }
      ]
    }
  }
]

// Additional questions to reach target of 100-200 questions
const additionalQuestions = [
  // More OOP Questions
  {
    content: "What is polymorphism in OOP?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "OOP",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'The ability of objects to take multiple forms', is_correct: true },
        { id: 'b', text: 'The ability to create multiple classes', is_correct: false },
        { id: 'c', text: 'The ability to inherit from multiple classes', is_correct: false },
        { id: 'd', text: 'The ability to create multiple objects', is_correct: false }
      ]
    }
  },
  {
    content: "What is encapsulation?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "OOP",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Hiding internal implementation details', is_correct: true },
        { id: 'b', text: 'Creating multiple classes', is_correct: false },
        { id: 'c', text: 'Inheriting from parent class', is_correct: false },
        { id: 'd', text: 'Overriding methods', is_correct: false }
      ]
    }
  },
  {
    content: "Describe the concept of abstraction in OOP with real-world examples.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "OOP",
    is_public: true
  },

  // More HTML Questions
  {
    content: "Which HTML attribute specifies an alternate text for an image?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'alt', is_correct: true },
        { id: 'b', text: 'title', is_correct: false },
        { id: 'c', text: 'src', is_correct: false },
        { id: 'd', text: 'longdesc', is_correct: false }
      ]
    }
  },
  {
    content: "Which HTML element is used to specify a footer for a document or section?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: '<footer>', is_correct: true },
        { id: 'b', text: '<bottom>', is_correct: false },
        { id: 'c', text: '<section>', is_correct: false },
        { id: 'd', text: '<div>', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the importance of semantic HTML and list at least 5 semantic elements introduced in HTML5.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "HTML",
    is_public: true
  },

  // More CSS Questions
  {
    content: "Which CSS property controls the text size?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "CSS",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'font-size', is_correct: true },
        { id: 'b', text: 'text-size', is_correct: false },
        { id: 'c', text: 'font-style', is_correct: false },
        { id: 'd', text: 'text-style', is_correct: false }
      ]
    }
  },
  {
    content: "What is CSS Grid?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "CSS",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'A 2D layout system for CSS', is_correct: true },
        { id: 'b', text: 'A 1D layout system for CSS', is_correct: false },
        { id: 'c', text: 'A color system for CSS', is_correct: false },
        { id: 'd', text: 'A animation system for CSS', is_correct: false }
      ]
    }
  },
  {
    content: "Compare and contrast CSS Flexbox and CSS Grid. When would you use each layout system?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "CSS",
    is_public: true
  },

  // More JavaScript Questions
  {
    content: "Which method is used to add an element to the end of an array in JavaScript?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "JavaScript",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'push()', is_correct: true },
        { id: 'b', text: 'pop()', is_correct: false },
        { id: 'c', text: 'shift()', is_correct: false },
        { id: 'd', text: 'unshift()', is_correct: false }
      ]
    }
  },
  {
    content: "What is the difference between synchronous and asynchronous JavaScript?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "JavaScript",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Synchronous executes line by line, asynchronous can execute without waiting', is_correct: true },
        { id: 'b', text: 'Asynchronous executes line by line, synchronous can execute without waiting', is_correct: false },
        { id: 'c', text: 'Both work the same way', is_correct: false },
        { id: 'd', text: 'Synchronous is always faster', is_correct: false }
      ]
    }
  },
  {
    content: "Explain promises in JavaScript. How do they help with asynchronous programming?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "JavaScript",
    is_public: true
  },

  // More PHP Questions
  {
    content: "Which PHP function is used to include a file?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "PHP",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'include()', is_correct: true },
        { id: 'b', text: 'import()', is_correct: false },
        { id: 'c', text: 'require()', is_correct: true },
        { id: 'd', text: 'add()', is_correct: false }
      ]
    }
  },
  {
    content: "What is a PHP session?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "PHP",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'A way to store information to be used across multiple pages', is_correct: true },
        { id: 'b', text: 'A way to connect to database', is_correct: false },
        { id: 'c', text: 'A way to send emails', is_correct: false },
        { id: 'd', text: 'A way to create classes', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the difference between GET and POST methods in PHP. When would you use each?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "PHP",
    is_public: true
  },

  // More Java Questions
  {
    content: "Which keyword is used to inherit a class in Java?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "Java",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'extends', is_correct: true },
        { id: 'b', text: 'inherits', is_correct: false },
        { id: 'c', text: 'implements', is_correct: false },
        { id: 'd', text: 'super', is_correct: false }
      ]
    }
  },
  {
    content: "What is an interface in Java?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "Java",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'A contract that defines method signatures without implementation', is_correct: true },
        { id: 'b', text: 'A class with all methods implemented', is_correct: false },
        { id: 'c', text: 'A way to connect to database', is_correct: false },
        { id: 'd', text: 'A type of variable', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the concept of multithreading in Java and how to implement it.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "Java",
    is_public: true
  },

  // More C Questions
  {
    content: "Which operator is used to access the value of a pointer in C?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: '*', is_correct: true },
        { id: 'b', text: '&', is_correct: false },
        { id: 'c', text: '->', is_correct: false },
        { id: 'd', text: '.', is_correct: false }
      ]
    }
  },
  {
    content: "What is a structure in C?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'A user-defined data type that groups related data', is_correct: true },
        { id: 'b', text: 'A type of loop', is_correct: false },
        { id: 'c', text: 'A type of function', is_correct: false },
        { id: 'd', text: 'A type of variable', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the difference between pass by value and pass by reference in C with examples.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "C",
    is_public: true
  },

  // More C++ Questions
  {
    content: "Which operator is used for dynamic memory allocation in C++?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C++",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'new', is_correct: true },
        { id: 'b', text: 'malloc', is_correct: false },
        { id: 'c', text: 'alloc', is_correct: false },
        { id: 'd', text: 'create', is_correct: false }
      ]
    }
  },
  {
    content: "What is a constructor in C++?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C++",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'A special method called when an object is created', is_correct: true },
        { id: 'b', text: 'A method that destroys objects', is_correct: false },
        { id: 'c', text: 'A type of variable', is_correct: false },
        { id: 'd', text: 'A type of loop', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the concept of templates in C++ and provide examples of function and class templates.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "C++",
    is_public: true
  },

  // Additional OOP Questions
  {
    content: "What is the difference between aggregation and composition?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "OOP",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Aggregation is "has-a" relationship, composition is "part-of" relationship', is_correct: true },
        { id: 'b', text: 'Composition is "has-a" relationship, aggregation is "part-of" relationship', is_correct: false },
        { id: 'c', text: 'Both are the same', is_correct: false },
        { id: 'd', text: 'Neither represents relationships', is_correct: false }
      ]
    }
  },
  {
    content: "What is method overriding?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "OOP",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Redefining a method in a derived class that exists in the base class', is_correct: true },
        { id: 'b', text: 'Creating multiple methods with same name but different parameters', is_correct: false },
        { id: 'c', text: 'Calling a method from another class', is_correct: false },
        { id: 'd', text: 'Deleting a method from a class', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the SOLID principles in object-oriented programming with examples.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "OOP",
    is_public: true
  },
  {
    content: "What is a design pattern? Name and explain at least 3 common design patterns.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "OOP",
    is_public: true
  },
  {
    content: "Which of the following are characteristics of object-oriented programming? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "OOP",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Data hiding', is_correct: true },
        { id: 'b', text: 'Code reusability', is_correct: true },
        { id: 'c', text: 'Modularity', is_correct: true },
        { id: 'd', text: 'Global variables', is_correct: false },
        { id: 'e', text: 'Maintainability', is_correct: true }
      ]
    }
  },

  // Additional HTML Questions
  {
    content: "What is the purpose of the DOCTYPE declaration in HTML?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'To tell the browser which version of HTML the page is written in', is_correct: true },
        { id: 'b', text: 'To include CSS styles', is_correct: false },
        { id: 'c', text: 'To include JavaScript', is_correct: false },
        { id: 'd', text: 'To set the page title', is_correct: false }
      ]
    }
  },
  {
    content: "Which HTML element is used to create a hyperlink?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: '<a>', is_correct: true },
        { id: 'b', text: '<link>', is_correct: false },
        { id: 'c', text: '<href>', is_correct: false },
        { id: 'd', text: '<url>', is_correct: false }
      ]
    }
  },
  {
    content: "What is the difference between HTML elements and HTML tags?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Elements include opening tag, content, and closing tag; tags are just the markup', is_correct: true },
        { id: 'b', text: 'Tags include opening tag, content, and closing tag; elements are just the markup', is_correct: false },
        { id: 'c', text: 'There is no difference', is_correct: false },
        { id: 'd', text: 'Elements are faster than tags', is_correct: false }
      ]
    }
  },
  {
    content: "Which HTML5 input types are available for forms? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "HTML",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'email', is_correct: true },
        { id: 'b', text: 'date', is_correct: true },
        { id: 'c', text: 'color', is_correct: true },
        { id: 'd', text: 'number', is_correct: true },
        { id: 'e', text: 'username', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the difference between HTML, XHTML, and HTML5. What are the key improvements in HTML5?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "HTML",
    is_public: true
  },

  // Additional CSS Questions
  {
    content: "What is the CSS cascade and how does specificity work?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "CSS",
    is_public: true
  },
  {
    content: "Which CSS pseudo-classes can be used for styling? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "CSS",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: ':hover', is_correct: true },
        { id: 'b', text: ':focus', is_correct: true },
        { id: 'c', text: ':first-child', is_correct: true },
        { id: 'd', text: ':last-child', is_correct: true },
        { id: 'e', text: ':click', is_correct: false }
      ]
    }
  },
  {
    content: "What is the difference between margin and padding?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "CSS",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Margin is outside the element, padding is inside the element', is_correct: true },
        { id: 'b', text: 'Padding is outside the element, margin is inside the element', is_correct: false },
        { id: 'c', text: 'Both work the same way', is_correct: false },
        { id: 'd', text: 'Margin is faster than padding', is_correct: false }
      ]
    }
  },
  {
    content: "Which CSS units are relative? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "CSS",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'em', is_correct: true },
        { id: 'b', text: 'rem', is_correct: true },
        { id: 'c', text: '%', is_correct: true },
        { id: 'd', text: 'px', is_correct: false },
        { id: 'e', text: 'vw', is_correct: true }
      ]
    }
  },
  {
    content: "What is CSS preprocessor? Compare SASS, LESS, and Stylus.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "CSS",
    is_public: true
  },

  // Additional JavaScript Questions
  {
    content: "What is the difference between == and === in JavaScript?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "JavaScript",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: '== compares values with type coercion, === compares values and types strictly', is_correct: true },
        { id: 'b', text: '=== compares values with type coercion, == compares values and types strictly', is_correct: false },
        { id: 'c', text: 'Both work the same way', is_correct: false },
        { id: 'd', text: '== is faster than ===', is_correct: false }
      ]
    }
  },
  {
    content: "Which JavaScript array methods modify the original array? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "JavaScript",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'push()', is_correct: true },
        { id: 'b', text: 'pop()', is_correct: true },
        { id: 'c', text: 'splice()', is_correct: true },
        { id: 'd', text: 'map()', is_correct: false },
        { id: 'e', text: 'filter()', is_correct: false }
      ]
    }
  },
  {
    content: "What is hoisting in JavaScript?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "JavaScript",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Moving variable and function declarations to the top of their scope', is_correct: true },
        { id: 'b', text: 'Lifting objects to memory', is_correct: false },
        { id: 'c', text: 'Creating new variables', is_correct: false },
        { id: 'd', text: 'Deleting variables', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the event loop in JavaScript and how it handles asynchronous operations.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "JavaScript",
    is_public: true
  },
  {
    content: "What are arrow functions and how do they differ from regular functions?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "JavaScript",
    is_public: true
  },

  // Additional PHP Questions
  {
    content: "What is the difference between mysqli and PDO in PHP?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "PHP",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'PDO supports multiple databases, mysqli only supports MySQL', is_correct: true },
        { id: 'b', text: 'mysqli supports multiple databases, PDO only supports MySQL', is_correct: false },
        { id: 'c', text: 'Both work the same way', is_correct: false },
        { id: 'd', text: 'mysqli is faster than PDO', is_correct: false }
      ]
    }
  },
  {
    content: "Which PHP superglobals are available? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "PHP",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: '$_GET', is_correct: true },
        { id: 'b', text: '$_POST', is_correct: true },
        { id: 'c', text: '$_SESSION', is_correct: true },
        { id: 'd', text: '$_COOKIE', is_correct: true },
        { id: 'e', text: '$_LOCAL', is_correct: false }
      ]
    }
  },
  {
    content: "What is composer in PHP?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "PHP",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'A dependency management tool for PHP', is_correct: true },
        { id: 'b', text: 'A code editor for PHP', is_correct: false },
        { id: 'c', text: 'A database for PHP', is_correct: false },
        { id: 'd', text: 'A web server for PHP', is_correct: false }
      ]
    }
  },
  {
    content: "Explain object-oriented programming in PHP. How do you create classes and objects?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "PHP",
    is_public: true
  },
  {
    content: "What are PHP namespaces and why are they important?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "PHP",
    is_public: true
  },

  // Additional Java Questions
  {
    content: "What is the difference between abstract class and interface in Java?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "Java",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Abstract class can have concrete methods, interface cannot (before Java 8)', is_correct: true },
        { id: 'b', text: 'Interface can have concrete methods, abstract class cannot', is_correct: false },
        { id: 'c', text: 'Both work the same way', is_correct: false },
        { id: 'd', text: 'Abstract class is faster than interface', is_correct: false }
      ]
    }
  },
  {
    content: "Which Java collections are thread-safe? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.hard,
    category: "Java",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Vector', is_correct: true },
        { id: 'b', text: 'Hashtable', is_correct: true },
        { id: 'c', text: 'ArrayList', is_correct: false },
        { id: 'd', text: 'HashMap', is_correct: false },
        { id: 'e', text: 'ConcurrentHashMap', is_correct: true }
      ]
    }
  },
  {
    content: "What is the Java Virtual Machine (JVM)?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "Java",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'A runtime environment that executes Java bytecode', is_correct: true },
        { id: 'b', text: 'A code editor for Java', is_correct: false },
        { id: 'c', text: 'A database for Java', is_correct: false },
        { id: 'd', text: 'A web server for Java', is_correct: false }
      ]
    }
  },
  {
    content: "Explain exception handling in Java. What are checked and unchecked exceptions?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "Java",
    is_public: true
  },
  {
    content: "What are Java generics and why are they useful? Provide examples.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "Java",
    is_public: true
  },

  // Additional C Questions
  {
    content: "What is the difference between malloc() and calloc()?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'calloc() initializes memory to zero, malloc() does not', is_correct: true },
        { id: 'b', text: 'malloc() initializes memory to zero, calloc() does not', is_correct: false },
        { id: 'c', text: 'Both work the same way', is_correct: false },
        { id: 'd', text: 'malloc() is faster than calloc()', is_correct: false }
      ]
    }
  },
  {
    content: "Which storage classes are available in C? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'auto', is_correct: true },
        { id: 'b', text: 'static', is_correct: true },
        { id: 'c', text: 'extern', is_correct: true },
        { id: 'd', text: 'register', is_correct: true },
        { id: 'e', text: 'global', is_correct: false }
      ]
    }
  },
  {
    content: "What is a preprocessor directive in C?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Instructions processed before compilation', is_correct: true },
        { id: 'b', text: 'Instructions processed after compilation', is_correct: false },
        { id: 'c', text: 'Instructions processed during runtime', is_correct: false },
        { id: 'd', text: 'Instructions for the linker', is_correct: false }
      ]
    }
  },
  {
    content: "Explain file handling in C. How do you read from and write to files?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.medium,
    category: "C",
    is_public: true
  },
  {
    content: "What are function pointers in C and how are they used?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "C",
    is_public: true
  },

  // Additional C++ Questions
  {
    content: "What is the difference between struct and class in C++?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C++",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'struct members are public by default, class members are private by default', is_correct: true },
        { id: 'b', text: 'class members are public by default, struct members are private by default', is_correct: false },
        { id: 'c', text: 'There is no difference', is_correct: false },
        { id: 'd', text: 'struct is faster than class', is_correct: false }
      ]
    }
  },
  {
    content: "Which C++ features support polymorphism? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C++",
    is_multiple_answer: true,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Virtual functions', is_correct: true },
        { id: 'b', text: 'Function overloading', is_correct: true },
        { id: 'c', text: 'Operator overloading', is_correct: true },
        { id: 'd', text: 'Templates', is_correct: true },
        { id: 'e', text: 'Preprocessor directives', is_correct: false }
      ]
    }
  },
  {
    content: "What is RAII in C++?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.hard,
    category: "C++",
    is_multiple_answer: false,
    is_public: true,
    options: {
      answers: [
        { id: 'a', text: 'Resource Acquisition Is Initialization', is_correct: true },
        { id: 'b', text: 'Random Access Interface Implementation', is_correct: false },
        { id: 'c', text: 'Rapid Application Interface Integration', is_correct: false },
        { id: 'd', text: 'Runtime Application Instance Initialization', is_correct: false }
      ]
    }
  },
  {
    content: "Explain the Standard Template Library (STL) in C++. What are its main components?",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "C++",
    is_public: true
  },
  {
    content: "What are smart pointers in C++? Compare unique_ptr, shared_ptr, and weak_ptr.",
    type: QuestionType.essay,
    difficulty: QuestionDifficulty.hard,
    category: "C++",
    is_public: true
  }
]

// Combine all questions
const allQuestions = [...questionsData, ...additionalQuestions]

async function seedQuestionCategories() {
  console.log('Starting to seed question categories...')

  try {
    for (const category of categories) {
      await prisma.questionCategory.upsert({
        where: { name: category.name },
        update: { description: category.description },
        create: category,
      })
      console.log(`✅ Category "${category.name}" created/updated`)
    }

    console.log(`🎉 Successfully seeded ${categories.length} categories`)
  } catch (error) {
    console.error('❌ Error seeding categories:', error)
    throw error
  }
}

async function seedQuestions() {
  console.log('Starting to seed questions...')

  try {
    // Get all categories to map names to IDs
    const categoryMap = new Map()
    const dbCategories = await prisma.questionCategory.findMany()
    dbCategories.forEach(cat => {
      categoryMap.set(cat.name, cat.category_id)
    })

    let questionCount = 0
    const defaultCreatedBy = 1 // Assuming admin user ID is 1

    for (const questionData of allQuestions) {
      const categoryId = categoryMap.get(questionData.category)
      
      if (!categoryId) {
        console.warn(`⚠️  Category "${questionData.category}" not found, skipping question`)
        continue
      }

      // Check if question already exists
      const existingQuestion = await prisma.question.findFirst({
        where: {
          content: questionData.content,
          type: questionData.type,
        },
      })

      if (existingQuestion) {
        console.log(`⏭️  Question already exists: "${questionData.content.substring(0, 50)}..."`)
        continue
      }

      const questionToCreate = {
        content: questionData.content,
        type: questionData.type,
        difficulty: questionData.difficulty || QuestionDifficulty.medium,
        category_id: categoryId,
        is_multiple_answer: questionData.is_multiple_answer || false,
        options: questionData.options || null,
        created_by: defaultCreatedBy,
        is_public: questionData.is_public || true,
      }

      await prisma.question.create({
        data: questionToCreate,
      })

      questionCount++
      console.log(`✅ Question ${questionCount}: "${questionData.content.substring(0, 50)}..." (${questionData.category})`)
    }

    console.log(`🎉 Successfully seeded ${questionCount} questions`)
  } catch (error) {
    console.error('❌ Error seeding questions:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting database seeding...')
  
  try {
    await seedQuestionCategories()
    await seedQuestions()
    
    // Final summary
    const categoryCount = await prisma.questionCategory.count()
    const questionCount = await prisma.question.count()
    
    console.log('\n📊 Seeding Summary:')
    console.log(`📁 Categories: ${categoryCount}`)
    console.log(`❓ Questions: ${questionCount}`)
    console.log('✨ Database seeding completed successfully!')
    
  } catch (error) {
    console.error('💥 Fatal error during seeding:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main()
    .catch((error) => {
      console.error('💥 Unhandled error:', error)
      process.exit(1)
    })
}

export { main as seedQuestions, seedQuestionCategories }