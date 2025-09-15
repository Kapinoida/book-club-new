import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.discussionQuestion.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  // Skip creating admin user - let NextAuth handle it during OAuth sign-in

  // Create current book (February 2024)
  const currentBook = await prisma.book.create({
    data: {
      title: "The Midnight Library",
      author: "Matt Haig",
      description:
        "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
      readMonth: new Date(2025, 1, 1), // February 2025
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg",
    },
  });

  // Create upcoming book (March 2024)
  const upcomingBook = await prisma.book.create({
    data: {
      title: "Cloud Cuckoo Land",
      author: "Anthony Doerr",
      description:
        "Set in Constantinople in the fifteenth century, in a small town in present-day Idaho, and on an interstellar ship decades from now.",
      readMonth: new Date(2025, 2, 1), // March 2025
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1618589128i/56783258.jpg",
    },
  });

  // Create discussion questions for current book
  const questions = [
    {
      question:
        "What would you do if you had access to the Midnight Library? Which life would you want to try first?",
      breakpoint: 25, // After reading 25%
    },
    {
      question:
        "How does Nora's relationship with Mrs. Elm influence her journey through the library?",
      breakpoint: 50,
    },
    {
      question:
        "What role does regret play in the story, and how does it shape Nora's choices?",
      breakpoint: 75,
    },
    {
      question:
        "Discuss the significance of the library itself as a metaphor. What does it represent?",
      breakpoint: 90,
    },
  ];

  for (const q of questions) {
    await prisma.discussionQuestion.create({
      data: {
        ...q,
        bookId: currentBook.id,
      },
    });
  }

  console.log({
    currentBook,
    upcomingBook,
    questionsCreated: questions.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
