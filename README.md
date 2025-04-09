# Documentation

## How to Use ?
The API is documented in the main code itself, check it out for payload or params
(Check test.py for direct endpoints)

## Setup

Make a MongoDB DB called LocationDB along with a table driverlocation

```
{
    userID : "a_user_id_string",
    location : {
        coordinates : [Longitude, Latitude]
        type : "Point"
    }
    status : "F"
}
```

Where status can be "F" for Free, "B" for busy (during ride), "O" for offline

To geospatially index give 'location' field (2dsphere index)
