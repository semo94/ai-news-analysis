import React from "react";
import { TextField, Button, Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { styled } from "@mui/system";

const SearchContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const SearchInput = styled(TextField)(({ theme }) => ({
  marginRight: theme.spacing(1),
}));

const SearchButton = styled(Button)(({ theme }) => ({
  minWidth: "150px",
}));

const SearchComponent = ({ onSearch }) => {
  const [query, setQuery] = React.useState("");

  const handleSearch = () => {
    onSearch(query);
  };

  return (
    <SearchContainer>
      <SearchInput
        label="Search for articles"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        variant="outlined"
      />
      <SearchButton
        variant="contained"
        color="primary"
        onClick={handleSearch}
        startIcon={<SearchIcon />}
      >
        Search
      </SearchButton>
    </SearchContainer>
  );
};

export default SearchComponent;
