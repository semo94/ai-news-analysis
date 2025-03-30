import React, { useState } from "react";
import { Container, CssBaseline, CircularProgress, Typography, Box } from "@mui/material";
import SearchComponent from "./components/SearchComponent";
import ResultsComponent from "./components/ResultsComponent";
import DetailsComponent from "./components/DetailsComponent";
import axios from "axios";

const apiUrl = process.env.REACT_APP_URL;
console.log(process.env.REACT_APP_URL)


const App = () => {
  const [page, setPage] = useState("home");
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleContent, setArticleContent] = useState(null);
  const [articleAnalysis, setArticleAnalysis] = useState(null);
  const [loading, setLoading] = React.useState(false);


  const handleView = async (articleId) => {
    setLoading(true);
    // get original article content
    const selectedArticle = articles.find((article) => article.id === articleId);
    setSelectedArticle(selectedArticle);
    const parsedArticle = await parseArticle(selectedArticle.url);
    const originalArticle = `
    publisher: ${selectedArticle.publisher}\n
    Date: ${selectedArticle.publishedAt}\n
    Author: ${selectedArticle.author}\n
    title: ${selectedArticle.title}\n
    Article: ${parsedArticle.data}
    `;
    setArticleContent(originalArticle);
    // Start the article analysis and get the task ID
    const taskId = await startAnalysis(originalArticle);

    // Poll the server for the analysis result
    const pollInterval = setInterval(async () => {
      const result = await checkAnalysis(taskId);

      if (result.status === "completed") {
        clearInterval(pollInterval);
        setArticleAnalysis(result.result.choices[0].message.content);
        setLoading(false);
        setPage("details");
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleSearch = async (query) => {
    try {
      const response = await axios.post(
        `${apiUrl}/api/search`,
        { query }
      )
      const articles = response.data.articles.map((article, index) => ({
        id: index,
        title: article.title,
        url: article.url,
        author: article.author,
        publisher: article.source.name,
        publishedAt: article.publishedAt
      }));
      setArticles(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedArticle(null);
    setArticleContent(null);
    setArticleAnalysis(null);
    setPage("home");
  };

  const startAnalysis = async (content) => {
    try {
      const response = await axios.post(
        `${apiUrl}/api/start-analysis`,
        { content }
      );
      return response.data.taskId;
    } catch (error) {
      console.error("Error starting the article analysis:", error);
    }
  };

  const checkAnalysis = async (taskId) => {
    try {
      const response = await axios.get(
        `${apiUrl}/api/check-analysis/${taskId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error checking the article analysis:", error);
    }
  };

  const parseArticle = async (url) => {
    try {
      return axios.get(
        `${apiUrl}/api/parse?url=${url}`
      );
    } catch (error) {
      console.error("Error parsing the article:", error);
    }
  }

  return (
    <div className="App">
      {loading ? (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height="100vh"
        >
          <Box>
            <CircularProgress />
          </Box>
          <Box>
            <Typography variant="h4" color="textSecondary">
              A GPT magic is being brewed... Please be patient!
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
            <Container>
              <CssBaseline />
          {page === "home" && (
            <>
              <SearchComponent onSearch={handleSearch} />
              <ResultsComponent articles={articles} onView={handleView} />
            </>
          )}
          {page === "details" && (
            <DetailsComponent
                  article={articleContent}
                  analysis={articleAnalysis}
                  onBack={handleBack}
            />
          )}
            </Container>
        </>
      )}
    </div>
  );
};

export default App;
