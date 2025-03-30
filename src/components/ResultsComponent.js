import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Button } from "@mui/material";

const ResultsComponent = ({ articles, loading, onView }) => {
  const hasResults = articles && articles.length > 0;

  return (
    <>
      {hasResults ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell align="right">Content analysis</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell component="th" scope="row">
                    {article.title}
                  </TableCell>
                  <TableCell align="right">
                          <Button variant="contained" color="primary" disabled={loading} onClick={() => onView(article.id)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box textAlign="center" marginTop={4}>
          <Typography variant="h6" color="textSecondary">
            No results found. Please try another search.
          </Typography>
        </Box>
      )}
    </>
  );
};

export default ResultsComponent;
