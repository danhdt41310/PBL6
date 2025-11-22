import { PrismaClient, QuestionType, QuestionDifficulty } from '@prisma/exams-client'
import { config } from 'dotenv'
config()

const prisma = new PrismaClient({
  datasourceUrl: process.env.EXAMS_DATABASE_URL,
})

// Default admin/teacher user ID
const DEFAULT_CREATED_BY = 2

// Categories data
const categories = [
  { name: 'OOP', description: 'Object-Oriented Programming concepts and principles', created_by: DEFAULT_CREATED_BY },
  { name: 'HTML', description: 'HyperText Markup Language for web structure', created_by: DEFAULT_CREATED_BY },
  { name: 'CSS', description: 'Cascading Style Sheets for web styling', created_by: DEFAULT_CREATED_BY },
  { name: 'JavaScript', description: 'JavaScript programming language', created_by: DEFAULT_CREATED_BY },
  { name: 'PHP', description: 'PHP: Hypertext Preprocessor server-side scripting', created_by: DEFAULT_CREATED_BY },
  { name: 'Java', description: 'Java programming language', created_by: DEFAULT_CREATED_BY },
  { name: 'C', description: 'C programming language', created_by: DEFAULT_CREATED_BY },
  { name: 'C++', description: 'C++ programming language', created_by: DEFAULT_CREATED_BY },
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
    options: [
      { id: 1, text: '=Encapsulation, Inheritance, Polymorphism, Abstraction' },
      { id: 2, text: '~Only Inheritance and Polymorphism' },
      { id: 3, text: '~Only Encapsulation' },
      { id: 4, text: '~Procedural programming concepts' }
    ]
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
    options: [
      { id: 1, text: '=Encapsulation' },
      { id: 2, text: '=Inheritance' },
      { id: 3, text: '=Polymorphism' },
      { id: 4, text: '~Compilation' },
      { id: 5, text: '=Abstraction' }
    ]
  },
  {
    content: "What is method overloading?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "OOP",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Using the same method name with different parameters' },
      { id: 2, text: '~Using different method names with same parameters' },
      { id: 3, text: '~Creating multiple classes' },
      { id: 4, text: '~Inheriting from multiple classes' }
    ]
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
    options: [
      { id: 1, text: '=HyperText Markup Language' },
      { id: 2, text: '~High Tech Modern Language' },
      { id: 3, text: '~Home Tool Markup Language' },
      { id: 4, text: '~Hyperlink and Text Markup Language' }
    ]
  },
  {
    content: "Which HTML tag is used for the largest heading?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=<h1>' },
      { id: 2, text: '~<h6>' },
      { id: 3, text: '~<heading>' },
      { id: 4, text: '~<header>' }
    ]
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
    options: [
      { id: 1, text: '=<header>' },
      { id: 2, text: '=<nav>' },
      { id: 3, text: '=<section>' },
      { id: 4, text: '~<div>' },
      { id: 5, text: '=<footer>' }
    ]
  },
  {
    content: "What is the difference between block and inline elements in HTML?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Block elements take full width, inline elements only take necessary width' },
      { id: 2, text: '~Inline elements take full width, block elements only take necessary width' },
      { id: 3, text: '~There is no difference' },
      { id: 4, text: '~Block elements are faster to load' }
    ]
  },

  // CSS Questions
  {
    content: "What does CSS stand for?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "CSS",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Cascading Style Sheets' },
      { id: 2, text: '~Computer Style Sheets' },
      { id: 3, text: '~Creative Style Sheets' },
      { id: 4, text: '~Colorful Style Sheets' }
    ]
  },
  {
    content: "Which CSS property is used to change the text color?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "CSS",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=color' },
      { id: 2, text: '~text-color' },
      { id: 3, text: '~font-color' },
      { id: 4, text: '~text-style' }
    ]
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
    options: [
      { id: 1, text: '=block' },
      { id: 2, text: '~inline-block' },
      { id: 3, text: '=flex' },
      { id: 4, text: '=grid' },
      { id: 5, text: '~inline' }
    ]
  },
  {
    content: "What is the difference between position: relative and position: absolute?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "CSS",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Relative positions relative to its normal position, absolute positions relative to nearest positioned ancestor' },
      { id: 2, text: '~Absolute positions relative to its normal position, relative positions relative to nearest positioned ancestor' },
      { id: 3, text: '~Both work the same way' },
      { id: 4, text: '~Relative is faster than absolute' }
    ]
  },

  // JavaScript Questions
  {
    content: "What is the correct syntax for creating a function in JavaScript?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "JavaScript",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=function myFunction() {}' },
      { id: 2, text: '~create myFunction() {}' },
      { id: 3, text: '~function = myFunction() {}' },
      { id: 4, text: '~def myFunction() {}' }
    ]
  },
  {
    content: "Which of the following are JavaScript data types? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "JavaScript",
    is_multiple_answer: true,
    is_public: true,
    options: [
      { id: 1, text: '=String' },
      { id: 2, text: '=Number' },
      { id: 3, text: '=Boolean' },
      { id: 4, text: '~Character' },
      { id: 5, text: '=Object' }
    ]
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
    options: [
      { id: 1, text: '=A function that has access to variables in its outer scope even after the outer function returns' },
      { id: 2, text: '~A way to close browser windows' },
      { id: 3, text: '~A method to end program execution' },
      { id: 4, text: '~A type of loop in JavaScript' }
    ]
  },
  {
    content: "What will console.log(typeof null) output?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "JavaScript",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=object' },
      { id: 2, text: '~null' },
      { id: 3, text: '~undefined' },
      { id: 4, text: '~string' }
    ]
  },

  // PHP Questions
  {
    content: "What does PHP stand for?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "PHP",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=PHP: Hypertext Preprocessor' },
      { id: 2, text: '~Personal Home Page' },
      { id: 3, text: '~Private Home Page' },
      { id: 4, text: '~Professional Hypertext Processor' }
    ]
  },
  {
    content: "Which symbol is used to start a variable in PHP?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "PHP",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=$' },
      { id: 2, text: '~#' },
      { id: 3, text: '~@' },
      { id: 4, text: '~&' }
    ]
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
    options: [
      { id: 1, text: '=array_push()' },
      { id: 2, text: '=array_pop()' },
      { id: 3, text: '=array_merge()' },
      { id: 4, text: '~string_replace()' },
      { id: 5, text: '=array_filter()' }
    ]
  },
  {
    content: "What is the difference between == and === in PHP?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "PHP",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=== compares values, === compares values and types' },
      { id: 2, text: '~=== compares values, == compares values and types' },
      { id: 3, text: '~Both work the same way' },
      { id: 4, text: '~== is faster than ===' }
    ]
  },

  // Java Questions
  {
    content: "Which keyword is used to create a class in Java?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "Java",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=class' },
      { id: 2, text: '~Class' },
      { id: 3, text: '~create' },
      { id: 4, text: '~new' }
    ]
  },
  {
    content: "What is the entry point of a Java application?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "Java",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=public static void main(String[] args)' },
      { id: 2, text: '~public void start()' },
      { id: 3, text: '~public static void begin()' },
      { id: 4, text: '~public void main()' }
    ]
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
    options: [
      { id: 1, text: '=public' },
      { id: 2, text: '=private' },
      { id: 3, text: '=protected' },
      { id: 4, text: '=package-private (default)' },
      { id: 5, text: '~global' }
    ]
  },
  {
    content: "What is the difference between ArrayList and LinkedList in Java?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "Java",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=ArrayList uses array internally, LinkedList uses doubly linked list' },
      { id: 2, text: '~LinkedList uses array internally, ArrayList uses doubly linked list' },
      { id: 3, text: '~Both use the same internal structure' },
      { id: 4, text: '~ArrayList is always faster than LinkedList' }
    ]
  },

  // C Questions
  {
    content: "Who developed the C programming language?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "C",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Dennis Ritchie' },
      { id: 2, text: '~Bjarne Stroustrup' },
      { id: 3, text: '~James Gosling' },
      { id: 4, text: '~Linus Torvalds' }
    ]
  },
  {
    content: "Which header file is required for input/output operations in C?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "C",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=stdio.h' },
      { id: 2, text: '~iostream.h' },
      { id: 3, text: '~conio.h' },
      { id: 4, text: '~stdlib.h' }
    ]
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
    options: [
      { id: 1, text: '=malloc()' },
      { id: 2, text: '=calloc()' },
      { id: 3, text: '=realloc()' },
      { id: 4, text: '=free()' },
      { id: 5, text: '~alloc()' }
    ]
  },
  {
    content: "What is a pointer in C?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=A variable that stores the memory address of another variable' },
      { id: 2, text: '~A variable that stores the value of another variable' },
      { id: 3, text: '~A function that points to memory' },
      { id: 4, text: '~A data type in C' }
    ]
  },

  // C++ Questions
  {
    content: "Who developed C++?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "C++",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Bjarne Stroustrup' },
      { id: 2, text: '~Dennis Ritchie' },
      { id: 3, text: '~James Gosling' },
      { id: 4, text: '~Ken Thompson' }
    ]
  },
  {
    content: "Which header file is required for input/output streams in C++?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "C++",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=iostream' },
      { id: 2, text: '~stdio.h' },
      { id: 3, text: '~conio.h' },
      { id: 4, text: '~fstream' }
    ]
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
    options: [
      { id: 1, text: '=Classes and Objects' },
      { id: 2, text: '=Function Overloading' },
      { id: 3, text: '=Operator Overloading' },
      { id: 4, text: '~Pointers' },
      { id: 5, text: '=Templates' }
    ]
  },
  {
    content: "What is the difference between public, private, and protected access specifiers in C++?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C++",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Public: accessible from anywhere, Private: only within class, Protected: within class and derived classes' },
      { id: 2, text: '~Private: accessible from anywhere, Public: only within class, Protected: within class and derived classes' },
      { id: 3, text: '~All three work the same way' },
      { id: 4, text: '~Public is fastest, private is slowest' }
    ]
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
    options: [
      { id: 1, text: '=The ability of objects to take multiple forms' },
      { id: 2, text: '~The ability to create multiple classes' },
      { id: 3, text: '~The ability to inherit from multiple classes' },
      { id: 4, text: '~The ability to create multiple objects' }
    ]
  },
  {
    content: "What is encapsulation?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "OOP",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Hiding internal implementation details' },
      { id: 2, text: '~Creating multiple classes' },
      { id: 3, text: '~Inheriting from parent class' },
      { id: 4, text: '~Overriding methods' }
    ]
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
    options: [
      { id: 1, text: '=alt' },
      { id: 2, text: '~title' },
      { id: 3, text: '~src' },
      { id: 4, text: '~longdesc' }
    ]
  },
  {
    content: "Which HTML element is used to specify a footer for a document or section?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=<footer>' },
      { id: 2, text: '~<bottom>' },
      { id: 3, text: '~<section>' },
      { id: 4, text: '~<div>' }
    ]
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
    options: [
      { id: 1, text: '=font-size' },
      { id: 2, text: '~text-size' },
      { id: 3, text: '~font-style' },
      { id: 4, text: '~text-style' }
    ]
  },
  {
    content: "What is CSS Grid?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "CSS",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=A 2D layout system for CSS' },
      { id: 2, text: '~A 1D layout system for CSS' },
      { id: 3, text: '~A color system for CSS' },
      { id: 4, text: '~A animation system for CSS' }
    ]
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
    options: [
      { id: 1, text: '=push()' },
      { id: 2, text: '~pop()' },
      { id: 3, text: '~shift()' },
      { id: 4, text: '~unshift()' }
    ]
  },
  {
    content: "What is the difference between synchronous and asynchronous JavaScript?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "JavaScript",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Synchronous executes line by line, asynchronous can execute without waiting' },
      { id: 2, text: '~Asynchronous executes line by line, synchronous can execute without waiting' },
      { id: 3, text: '~Both work the same way' },
      { id: 4, text: '~Synchronous is always faster' }
    ]
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
    options: [
      { id: 1, text: '=include()' },
      { id: 2, text: '~import()' },
      { id: 3, text: '=require()' },
      { id: 4, text: '~add()' }
    ]
  },
  {
    content: "What is a PHP session?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "PHP",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=A way to store information to be used across multiple pages' },
      { id: 2, text: '~A way to connect to database' },
      { id: 3, text: '~A way to send emails' },
      { id: 4, text: '~A way to create classes' }
    ]
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
    options: [
      { id: 1, text: '=extends' },
      { id: 2, text: '~inherits' },
      { id: 3, text: '~implements' },
      { id: 4, text: '~super' }
    ]
  },
  {
    content: "What is an interface in Java?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "Java",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=A contract that defines method signatures without implementation' },
      { id: 2, text: '~A class with all methods implemented' },
      { id: 3, text: '~A way to connect to database' },
      { id: 4, text: '~A type of variable' }
    ]
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
    options: [
      { id: 1, text: '=*' },
      { id: 2, text: '~&' },
      { id: 3, text: '~->' },
      { id: 4, text: '~.' }
    ]
  },
  {
    content: "What is a structure in C?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=A user-defined data type that groups related data' },
      { id: 2, text: '~A type of loop' },
      { id: 3, text: '~A type of function' },
      { id: 4, text: '~A type of variable' }
    ]
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
    options: [
      { id: 1, text: '=new' },
      { id: 2, text: '~malloc' },
      { id: 3, text: '~alloc' },
      { id: 4, text: '~create' }
    ]
  },
  {
    content: "What is a constructor in C++?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C++",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=A special method called when an object is created' },
      { id: 2, text: '~A method that destroys objects' },
      { id: 3, text: '~A type of variable' },
      { id: 4, text: '~A type of loop' }
    ]
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
    options: [
      { id: 1, text: '=Aggregation is "has-a" relationship, composition is "part-of" relationship' },
      { id: 2, text: '~Composition is "has-a" relationship, aggregation is "part-of" relationship' },
      { id: 3, text: '~Both are the same' },
      { id: 4, text: '~Neither represents relationships' }
    ]
  },
  {
    content: "What is method overriding?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "OOP",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Redefining a method in a derived class that exists in the base class' },
      { id: 2, text: '~Creating multiple methods with same name but different parameters' },
      { id: 3, text: '~Calling a method from another class' },
      { id: 4, text: '~Deleting a method from a class' }
    ]
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
    options: [
      { id: 1, text: '=Data hiding' },
      { id: 2, text: '=Code reusability' },
      { id: 3, text: '=Modularity' },
      { id: 4, text: '~Global variables' },
      { id: 5, text: '=Maintainability' }
    ]
  },

  // Additional HTML Questions
  {
    content: "What is the purpose of the DOCTYPE declaration in HTML?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=To tell the browser which version of HTML the page is written in' },
      { id: 2, text: '~To include CSS styles' },
      { id: 3, text: '~To include JavaScript' },
      { id: 4, text: '~To set the page title' }
    ]
  },
  {
    content: "Which HTML element is used to create a hyperlink?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=<a>' },
      { id: 2, text: '~<link>' },
      { id: 3, text: '~<href>' },
      { id: 4, text: '~<url>' }
    ]
  },
  {
    content: "What is the difference between HTML elements and HTML tags?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "HTML",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Elements include opening tag, content, and closing tag; tags are just the markup' },
      { id: 2, text: '~Tags include opening tag, content, and closing tag; elements are just the markup' },
      { id: 3, text: '~There is no difference' },
      { id: 4, text: '~Elements are faster than tags' }
    ]
  },
  {
    content: "Which HTML5 input types are available for forms? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "HTML",
    is_multiple_answer: true,
    is_public: true,
    options: [
      { id: 1, text: '=email' },
      { id: 2, text: '=date' },
      { id: 3, text: '=color' },
      { id: 4, text: '=number' },
      { id: 5, text: '~username' }
    ]
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
    options: [
      { id: 1, text: '=:hover' },
      { id: 2, text: '=:focus' },
      { id: 3, text: '=:first-child' },
      { id: 4, text: '=:last-child' },
      { id: 5, text: '~:click' }
    ]
  },
  {
    content: "What is the difference between margin and padding?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "CSS",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Margin is outside the element, padding is inside the element' },
      { id: 2, text: '~Padding is outside the element, margin is inside the element' },
      { id: 3, text: '~Both work the same way' },
      { id: 4, text: '~Margin is faster than padding' }
    ]
  },
  {
    content: "Which CSS units are relative? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "CSS",
    is_multiple_answer: true,
    is_public: true,
    options: [
      { id: 1, text: '=em' },
      { id: 2, text: '=rem' },
      { id: 3, text: '=%' },
      { id: 4, text: '~px' },
      { id: 5, text: '=vw' }
    ]
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
    options: [
      { id: 1, text: '=== compares values with type coercion, === compares values and types strictly' },
      { id: 2, text: '~=== compares values with type coercion, == compares values and types strictly' },
      { id: 3, text: '~Both work the same way' },
      { id: 4, text: '~== is faster than ===' }
    ]
  },
  {
    content: "Which JavaScript array methods modify the original array? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "JavaScript",
    is_multiple_answer: true,
    is_public: true,
    options: [
      { id: 1, text: '=push()' },
      { id: 2, text: '=pop()' },
      { id: 3, text: '=splice()' },
      { id: 4, text: '~map()' },
      { id: 5, text: '~filter()' }
    ]
  },
  {
    content: "What is hoisting in JavaScript?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "JavaScript",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Moving variable and function declarations to the top of their scope' },
      { id: 2, text: '~Lifting objects to memory' },
      { id: 3, text: '~Creating new variables' },
      { id: 4, text: '~Deleting variables' }
    ]
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
    options: [
      { id: 1, text: '=PDO supports multiple databases, mysqli only supports MySQL' },
      { id: 2, text: '~mysqli supports multiple databases, PDO only supports MySQL' },
      { id: 3, text: '~Both work the same way' },
      { id: 4, text: '~mysqli is faster than PDO' }
    ]
  },
  {
    content: "Which PHP superglobals are available? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.easy,
    category: "PHP",
    is_multiple_answer: true,
    is_public: true,
    options: [
      { id: 1, text: '=$_GET' },
      { id: 2, text: '=$_POST' },
      { id: 3, text: '=$_SESSION' },
      { id: 4, text: '=$_COOKIE' },
      { id: 5, text: '~$_LOCAL' }
    ]
  },
  {
    content: "What is composer in PHP?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "PHP",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=A dependency management tool for PHP' },
      { id: 2, text: '~A code editor for PHP' },
      { id: 3, text: '~A database for PHP' },
      { id: 4, text: '~A web server for PHP' }
    ]
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
    options: [
      { id: 1, text: '=Abstract class can have concrete methods, interface cannot (before Java 8)' },
      { id: 2, text: '~Interface can have concrete methods, abstract class cannot' },
      { id: 3, text: '~Both work the same way' },
      { id: 4, text: '~Abstract class is faster than interface' }
    ]
  },
  {
    content: "Which Java collections are thread-safe? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.hard,
    category: "Java",
    is_multiple_answer: true,
    is_public: true,
    options: [
      { id: 1, text: '=Vector' },
      { id: 2, text: '=Hashtable' },
      { id: 3, text: '~ArrayList' },
      { id: 4, text: '~HashMap' },
      { id: 5, text: '=ConcurrentHashMap' }
    ]
  },
  {
    content: "What is the Java Virtual Machine (JVM)?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "Java",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=A runtime environment that executes Java bytecode' },
      { id: 2, text: '~A code editor for Java' },
      { id: 3, text: '~A database for Java' },
      { id: 4, text: '~A web server for Java' }
    ]
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
    options: [
      { id: 1, text: '=calloc() initializes memory to zero, malloc() does not' },
      { id: 2, text: '~malloc() initializes memory to zero, calloc() does not' },
      { id: 3, text: '~Both work the same way' },
      { id: 4, text: '~malloc() is faster than calloc()' }
    ]
  },
  {
    content: "Which storage classes are available in C? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C",
    is_multiple_answer: true,
    is_public: true,
    options: [
      { id: 1, text: '=auto' },
      { id: 2, text: '=static' },
      { id: 3, text: '=extern' },
      { id: 4, text: '=register' },
      { id: 5, text: '~global' }
    ]
  },
  {
    content: "What is a preprocessor directive in C?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Instructions processed before compilation' },
      { id: 2, text: '~Instructions processed after compilation' },
      { id: 3, text: '~Instructions processed during runtime' },
      { id: 4, text: '~Instructions for the linker' }
    ]
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
    options: [
      { id: 1, text: '=struct members are public by default, class members are private by default' },
      { id: 2, text: '~class members are public by default, struct members are private by default' },
      { id: 3, text: '~There is no difference' },
      { id: 4, text: '~struct is faster than class' }
    ]
  },
  {
    content: "Which C++ features support polymorphism? (Select all that apply)",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.medium,
    category: "C++",
    is_multiple_answer: true,
    is_public: true,
    options: [
      { id: 1, text: '=Virtual functions' },
      { id: 2, text: '=Function overloading' },
      { id: 3, text: '=Operator overloading' },
      { id: 4, text: '=Templates' },
      { id: 5, text: '~Preprocessor directives' }
    ]
  },
  {
    content: "What is RAII in C++?",
    type: QuestionType.multiple_choice,
    difficulty: QuestionDifficulty.hard,
    category: "C++",
    is_multiple_answer: false,
    is_public: true,
    options: [
      { id: 1, text: '=Resource Acquisition Is Initialization' },
      { id: 2, text: '~Random Access Interface Implementation' },
      { id: 3, text: '~Rapid Application Interface Integration' },
      { id: 4, text: '~Runtime Application Instance Initialization' }
    ]
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
        where: { 
          name_created_by: {
            name: category.name,
            created_by: DEFAULT_CREATED_BY
          }
        },
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

      // Convert options format if they exist
      const questionToCreate = {
        content: questionData.content,
        type: questionData.type,
        difficulty: questionData.difficulty || QuestionDifficulty.medium,
        category_id: categoryId,
        is_multiple_answer: questionData.is_multiple_answer || false,
        options: questionData.options || null,
        created_by: DEFAULT_CREATED_BY,
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