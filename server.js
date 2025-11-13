const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());


const data = JSON.parse(fs.readFileSync("./API/cities.json", "utf8"));


app.get("/api/continents", (req, res) => {
  res.json(Object.keys(data));
});


app.get("/api/countries", (req, res) => {
  const countriesSet = new Set();
  for (const continent of Object.keys(data)) {
    Object.keys(data[continent]).forEach(country => countriesSet.add(country));
  }
  res.json({ countries: Array.from(countriesSet).sort() });
});


app.get("/api/continents/:continent/countries", (req, res) => {
  const continent = req.params.continent;
  if (data[continent]) {
    res.json({ countries: Object.keys(data[continent]).sort() });
  } else {
    res.status(404).json({ error: "Continent not found" });
  }
});


app.get("/api/cities", (req, res) => {
  const { q, country } = req.query;
  const cities = [];

  for (const continent of Object.keys(data)) {
    for (const countryName of Object.keys(data[continent])) {
      const cityList = data[continent][countryName];
      cityList.forEach(city => {
        cities.push({
          name: city.name,
          country: countryName,
          continent,
          lat: city.lat,
          lon: city.lon
        });
      });
    }
  }

  let result = cities;

  if (country) {
    result = result.filter(c => c.country.toLowerCase() === country.toLowerCase());
  }
  if (q) {
    const qLower = q.toLowerCase();
    result = result.filter(c => c.name.toLowerCase().includes(qLower));
  }

  res.json({ total: result.length, results: result });
});


app.get("/api/countries/:country/cities", (req, res) => {
  const country = req.params.country;
  for (const continent in data) {
    if (data[continent][country]) {
      return res.json({ cities: data[continent][country], continent });
    }
  }
  res.status(404).json({ error: "Country not found" });
});


app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
