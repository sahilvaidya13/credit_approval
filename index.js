// Import necessary modules
const express = require("express");
const sequelize = require("./sequelize");
const CustomerData = require("./models/CustomerData");
const LoanData = require("./models/LoanData");
const { CustomerDataValidator } = require("./zodvalidator.js");
const app = express();
sequelize
  .sync()
  .then(() => {
    console.log("Models synced with the database.");
  })
  .catch((err) => {
    console.error("Error syncing models:", err);
  });

app.use(express.json());

app.post("/register", async (req, res) => {
  const RequestData = req.body;

  const validationResult = CustomerDataValidator.safeParse(RequestData);

  if (validationResult.success) {
    const { monthly_salary } = RequestData;
    const approved_limit = 36 * monthly_salary;

    let rounded_approved_limit = Math.round(approved_limit / 100000) * 100000;
    RequestData["approved_limit"] = rounded_approved_limit;
    CustomerData.findOne({
      attributes: ["customerID"],
      order: [["customerID", "DESC"]],
    })
      .then((lastCustomer) => {
        if (lastCustomer) {
          console.log("CustomerID of the last tuple:", lastCustomer.customerID);
          ResponseData["customerID"] = lastCustomer.customerID + 1;
          CustomerData.create(ResponseData)
            .then((createdRow) => {
              console.log("New row added successfully:", createdRow.toJSON());
              let NewCustomer = createdRow.toJSON();

              res.status(200).json(NewCustomer);
            })
            .catch((error) => {
              console.error("Error in creation of row:", error);
              res.status(500).json({ message: "Internal Server Error" });
            });
        } else {
          console.log("Table empty.");
        }
      })
      .catch((error) => {
        console.error("Error in lastCustomer finding:", error);
        res.status(409).json({ message: "Conflict with the service" });
      });
  } else {
    res.status(400).json({ message: "Bad Request:Validation error" });
  }
});

app.get("/view-loan/:loan_id", async (req, res) => {
  const { loan_id } = req.params;
  let final_result = {};
  let customer_data = {};
  try {
    LoanData.findOne({
      where: {
        loanID: loan_id,
      },
    })
      .then((result) => {
        if (result) {
          final_result = {
            loan_id: data.loanID,
            loan_amount: data.loan_amount,
            interest_rate: data.interest_rate,
            tenure: data.tenure,
            monthly_installment: data.monthly_payment,
          };
          CustomerData.findOne({
            where: {
              customerID: data.customerID,
            },
          })
            .then((customer_result) => {
              customer_data = {
                customer_id: customer_result.customerID,
                first_name: customer_result.first_name,
                last_name: customer_result.last_name,
                phone_number: customer_result.phone,
                age: customer_result.age,
              };
              if (customer_result) {
                res
                  .status(200)
                  .json({ ...final_result, customer: customer_data });
              } else {
                res.status(404).json({
                  message: "Customer data not linked with such Loan ID.",
                });
              }
            })
            .catch((error) => {
              console.log("customer_search_error", error);
              res.status(500).send("Error in service");
            });
        }
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send("Service Down. Contact Admin.");
      });
  } catch (error) {
    console.log("Error in code:", error);
    res.status(500).send("Service failed.");
  }
});

app.get("/view-statement/:customer_id/:loan_id?", async (req, res) => {
  const { customer_id, loan_id } = req.params;
  let result = [];
  try {
    if (loan_id) {
      result = await LoanData.findAll({
        where: {
          customerID: customer_id,
          loanID: loan_id,
        },
      });
    } else {
      result = await LoanData.findAll({
        where: {
          customerID: customer_id,
        },
      });
    }
    const updatedResult = result.map((element) => {
      const { loan_amount, emi_paid_ontime, monthly_payment } = element;
      const amount_paid = emi_paid_ontime * monthly_payment;
      const repayments_left = loan_amount - amount_paid;
      const principal = loan_amount;

      return {
        customer_id: element.customerID,
        loan_id: element.loanID,
        interest_rate: element.interest_rate,
        monthly_installment: element.monthly_payment,
        amount_paid,
        repayments_left,
        principal,
      };
    });

    console.log("Updated Result:", updatedResult);
    res.status(200).json(updatedResult);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/make-payment/:customer_id/:loan_id", async (req, res) => {
  const { customer_id, loan_id } = req.params;
  const { payment } = req.body;
  try {
    LoanData.findOne({
      where: {
        customerID: customer_id,
        loanID: loan_id,
      },
    })
      .then((result) => {
        const { monthly_payment } = result;
        if (payment === monthly_payment) {
          result["emi_paid_ontime"]++;
          res.status(200).send(result);
        } else {
          const { loan_amount, tenure, interest_rate, emi_paid_ontime } =
            result;

          const Amount_Left = loan_amount - monthly_payment * emi_paid_ontime;
          const tenure_left = tenure - emi_paid_ontime;
          let monthly_interest_rate = interest_rate / 12;
          monthly_interest_rate = monthly_interest_rate / 100;
          const v1 = Math.pow(1 + monthly_interest_rate, tenure_left);
          const v2 = Amount_Left * monthly_interest_rate * v1;
          const v3 = v1 - 1;
          const new_monthly_emi = v2 / v3;
          //Loan EMI Calculation formula for finding Monthly EMI.
          result["emi_paid_ontime"]++;
          result["monthly_payment"] = new_monthly_emi;
          res.status(200).send(result);
        }
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send("Service Down. Contact Admin.");
      });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Internal Server errror" });
  }
});

function isInCurrentYear(dateString) {
  const date = new Date(dateString);

  const year = date.getFullYear();

  const currentYear = new Date().getFullYear();

  return year === currentYear;
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}
app.post("/check-eligibility", async (req, res) => {
  const { customer_id, loan_amount, tenure, interest_rate } = req.body;
  const weight_past_loans_paidonTime = 0.4;
  const weight_no_loans_taken = 0.25;
  const weight_current_year_activity = 0.35;
  let paid_on_time = 0;
  let no_of_loans_taken = 0;
  let current_year = 0;
  let credit_score = 0;
  let approval = 0;
  let corrected_interest_rate = 0;
  try {
    CustomerData.findOne({
      where: {
        customerID: customer_id,
      },
    })
      .then((result) => {
        if (loan_amount > result.approved_limit) {
          credit_score = 0;
          res
            .status(200)
            .send({ customer_id: result.customer_id, approval: false });
        } else {
          LoanData.findAll({
            where: {
              customerID: customer_id,
            },
          })
            .then((result) => {
              result.map((element) => {
                no_of_loans_taken++;
                paid_on_time += element["emi_paid_ontime"];
                if (isInCurrentYear(element["date_of_approval"])) {
                  current_year++;
                }
              });
              credit_score =
                weight_past_loans_paidonTime * paid_on_time +
                weight_no_loans_taken * no_of_loans_taken +
                weight_current_year_activity * current_year;

              credit_score = clamp(credit_score);

              if (credit_score > 50) {
                approval = 1;
              } else if (credit_score > 30 && credit_score < 50) {
                corrected_interest_rate = 12;
              } else if (credit_score > 10 && credit_score < 30) {
                corrected_interest_rate = 16;
              }
              res.status(200).json({
                customer_id: customer_id,
                approval,
                interest_rate,
                corrected_interest_rate,
                tenure,
                monthly_installment: element.monthly_payment,
              });
            })
            .catch((error) => {
              console.log(error);
              res
                .status(500)
                .send({ message: "Error while fetching the data" });
            });
        }
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send({ message: "Server Error" });
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});
app.post("/create-loan", async (req, res) => {
  const { customer_id, loan_amount, tenure, interest_rate } = req.body;
  const weight_past_loans_paidonTime = 0.4;
  const weight_no_loans_taken = 0.25;
  const weight_current_year_activity = 0.35;
  let paid_on_time = 0;
  let no_of_loans_taken = 0;
  let current_year = 0;
  let credit_score = 0;
  let approval = 0;
  let corrected_interest_rate = 0;
  try {
    CustomerData.findOne({
      where: {
        customerID: customer_id,
      },
    })
      .then((result) => {
        if (loan_amount > result.approved_limit) {
          credit_score = 0;
          res
            .status(200)
            .send({ customer_id: result.customer_id, approval: false });
        } else {
          LoanData.findAll({
            where: {
              customerID: customer_id,
            },
          })
            .then((result) => {
              result.map((element) => {
                no_of_loans_taken++;
                paid_on_time += element["emi_paid_ontime"];
                if (isInCurrentYear(element["date_of_approval"])) {
                  current_year++;
                }
              });
              credit_score =
                weight_past_loans_paidonTime * paid_on_time +
                weight_no_loans_taken * no_of_loans_taken +
                weight_current_year_activity * current_year;

              credit_score = clamp(credit_score);

              if (credit_score > 50) {
                approval = 1;
              } else if (credit_score > 30 && credit_score < 50) {
                corrected_interest_rate = 12;
              } else if (credit_score > 10 && credit_score < 30) {
                corrected_interest_rate = 16;
              }

              res.status(200).json({
                customer_id: customer_id,
                approval,
                loanID: result.loan_id,
                interest_rate,
                corrected_interest_rate,
                tenure,
                monthly_installment: element.monthly_payment,
              });
            })
            .catch((error) => {
              console.log(error);
              res
                .status(500)
                .send({ message: "Error while fetching the data" });
            });
        }
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send({ message: "Server Error" });
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
