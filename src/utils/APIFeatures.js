export class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };

    ["page", "sort", "limit", "fields"].forEach((el) => delete queryObj[el]);

    if (queryObj.minPrice || queryObj.maxPrice) queryObj.price = {};

    if (queryObj.minPrice) queryObj.price.$gte = Number(queryObj.minPrice);
    if (queryObj.maxPrice) queryObj.price.$lte = Number(queryObj.maxPrice);

    delete queryObj.minPrice;
    delete queryObj.maxPrice;

    const orConditions = [];

    for (const key in queryObj) {
      if (typeof queryObj[key] === "string") {
        orConditions.push({
          [key]: {
            $regex: queryObj[key],
            $options: "i",
          },
        });
        delete queryObj[key];
      }
    }
    if (orConditions.length) {
      queryObj.$or = orConditions;
    }
    console.log(queryObj);

    this.query = this.query.find(queryObj);

    return this;
  }

  sort() {
    console.log(this.queryString);
    if (this.queryString.sort) {
      this.query = this.query.sort(this.queryString.sort.split(",").join(" "));
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 20;
    const skip = (page - 1) * limit;

    console.log(skip);

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
