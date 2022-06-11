const { ApolloServer, gql } = require('apollo-server')
const {v1: uuid} = require('uuid')


let authors = [
  {
    name: 'Robert Martin',
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963
  },
  {
    name: 'Fyodor Dostoevsky',
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821
  },
  { 
    name: 'Joshua Kerievsky', // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  { 
    name: 'Sandi Metz', // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
]

/*
 * Suomi:
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 *
 * English:
 * It might make more sense to associate a book with its author by storing the author's id in the context of the book instead of the author's name
 * However, for simplicity, we will store the author's name in connection with the book
*/

let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ['agile', 'patterns', 'design']
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'patterns']
  },  
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'design']
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'crime']
  },
  {
    title: 'The Demon ',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'revolution']
  },
]

const typeDefs = gql`
  type Author {
    name: String!
    born: Int
    bookCount: Int!
  }

  type Book {
    title: String!
    author: String!
    published: String!
    genres: [String!]!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
  }
`

const resolvers = {
  Query: {
    bookCount: () => books.length,
    authorCount: () => authors.length, 
    allBooks: (root, args) => {
      if (!Object.keys(args)) {
        return books // no filter
      }

      let filteredBooks = JSON.parse(JSON.stringify(books))

      if (args.author) {
        filteredBooks = filteredBooks.filter(b => b.author === args.author)
      }

      if (args.genre) {
        filteredBooks = filteredBooks.filter(b => b.genres.includes(args.genre))
      }

      // here args.author exists, "filter by" here
      return filteredBooks
    },
    allAuthors: () => {
      let aryObj = []
      // iterate over authors, push a new elemnt
      authors.forEach(author => {
        aryObj.push({
          ...author,
          bookCount: books.filter(b => b.author === author.name).length
        })
      })
      // required structure:
      // [{name: 'Jason', bookCount: 4}, {...}, ...]
      return aryObj
    }
  },
  
  Mutation: {
    addBook: (root, args) => {
      // args contains the information for adding information in to server
      const newBook = {...args, id: uuid()}
      books = books.concat(newBook)
      // need to see if author exists in server
      let authorOfNewBook = newBook.author
      let isExistingAuthor = authors.find(a => a.name === authorOfNewBook)
      if (!isExistingAuthor) {
        // author does not exists
        // -- is added to the server!
        authors = authors.concat({
          name: authorOfNewBook,
          born: null, 
          id: uuid()
        })
      }

      return newBook
    },
    editAuthor: (root, args) => {
      let modifiedAuthor = {...args, born: args.setBornTo}
      let copiedAuthors = JSON.parse(JSON.stringify(authors))
      // see if author does not exists, if not, return null
      let existingAuthor = copiedAuthors.find(a => a.name === modifiedAuthor.name)
      if (!existingAuthor) return null
      // author thus exists!, update the authors state
      existingAuthor.born = modifiedAuthor.born
      authors = copiedAuthors // <== change states!
      return modifiedAuthor
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})