module Giraffe.ResponseWriters 

open Microsoft.FSharpLu.Json

/// Serializes the object to compact JSON, setting the status code to 200 and content-type header to "application/json".
let compactJson obj = 
    let jsonText = Compact.serialize obj 

    text jsonText 
    >=> setStatusCode 200 
    >=> setHttpHeader "Content-Type" "application/json"