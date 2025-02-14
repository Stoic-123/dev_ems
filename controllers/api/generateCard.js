const PDFDocument = require("pdfkit");
const moment = require('moment');
const con = require("../../config/db");
const path = require("path");
const fs = require("fs").promises; 
const sizeOf = require("image-size"); 
const generateEmployeeCard = async (req, res) => {
  try {
    const sql = "SELECT * FROM tbl_user WHERE user_id = ?";
    const [employeeData] = await con.query(sql, req.user.id, (err) => {
      if (err) throw err;
    });
    
    if (!employeeData || employeeData.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    const backgroundImagePath = path.join(
      __dirname,
      "../../public/upload/cardBackground/card_background.png"
    ); // Front background
    const card_back_background = path.join(
      __dirname,
      "../../public/upload/cardBackground/card_back_background.png"
    ); // back background
    
    // Create a new PDF document with custom dimensions
    const doc = new PDFDocument({
      size: [299, 462], // Match the dimensions of the background image
      layout: "portrait", // Use portrait mode
      margin: 0, // No margin for a clean look
    });
    
    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=${employeeData[0].first_name}_card.pdf`
    );
    // Handle PDF generation errors
    doc.on("error", (error) => {
      console.error("PDF generation error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF" });
      }
    });
    
    doc.registerFont('lato_font', path.join(__dirname, '../../public/assets/fonts/Lato/Lato-Regular.ttf'));
    doc.registerFont('merri_font', path.join(__dirname, '../../public/assets/fonts/Merriweather/Merriweather-Regular.ttf'));
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // ====================
    // Front Page
    // ====================
    doc.image(backgroundImagePath, 0, 0, { width: 299, height: 462 }); // Add front background image

    // Add the TS logo
    const tsLogoPath = path.join(__dirname, "../../public/upload/logo.png"); // Path to the TS logo
    try {
      await fs.access(tsLogoPath); // Check if the logo exists

      // Get logo dimensions
      const dimensions = sizeOf(tsLogoPath);
      const tsLogo = { width: dimensions.width, height: dimensions.height };

      const logoWidth = 55; // Desired width of the logo
      const logoHeight = (tsLogo.height / tsLogo.width) * logoWidth; // Maintain aspect ratio

      // Calculate x-coordinate to center the logo
      const xLogo = (299 - logoWidth) / 2;

      // Position the logo at the top center
      doc.image(tsLogoPath, xLogo, 20, {
        width: logoWidth,
        height: logoHeight,
      });

      // Add "TS Company" text below the logo (centered)
      doc
        .fillColor("white")
        .fontSize(16)
        .text("TS Company", 0, 15 + logoHeight + 10, {
          align: "center",
          width: 299,
        });
    } catch (error) {
      console.error("TS logo not found:", tsLogoPath);
      // Continue without the logo
    }

    // Add employee photo (if provided)
    if (employeeData[0].avatar) {
      const employeePhotoPath = path.join(
        __dirname,
        "../../public/upload/" + employeeData[0].avatar
      ); // Default photo path
      try {
        await fs.access(employeePhotoPath); // Check if the employee photo exists

        // Get image dimensions
        const dimensions = sizeOf(employeePhotoPath);
        const employeePhoto = {
          width: dimensions.width,
          height: dimensions.height,
        };

        const imageWidth = 130; // Desired width of the photo area
        const imageHeight = 120; // Desired height of the photo area

        // Use 'cover' or 'contain'
        const objectFit = "cover";
        const scaleX = imageWidth / employeePhoto.width;
        const scaleY = imageHeight / employeePhoto.height;
        const scale =
          objectFit === "cover"
            ? Math.max(scaleX, scaleY)
            : Math.min(scaleX, scaleY);

        const newWidth = employeePhoto.width * scale;
        const newHeight = employeePhoto.height * scale;

        const x = (299 - newWidth) / 2; // Center horizontally
        const y = 100.5; // Position below the header

        const radius = 5; // Border radius (50% of the width/height for a circle)
        doc
          .save()
          .roundedRect(x, y, newWidth, newHeight, radius) // Create a circular clipping path
          .clip() // Apply the clipping path
          .image(employeePhotoPath, x, y, {
            width: newWidth,
            height: newHeight,
          }) // Draw the image
          .restore();
      } catch (error) {
        console.error("Employee photo not found:", employeePhotoPath);
        // Continue without the employee photo
      }
    }

    // Add employee details
    doc
      .fillColor("black")
      .fontSize(18)
      .text(employeeData[0].last_name+" " + employeeData[0].first_name, 0, 250, { align: "center", width: 299 }); // Centered text

    doc
      .fontSize(14)
      .text("Front-End Developer", 0, 280, { align: "center", width: 299 }); // Centered text

    doc
      .fontSize(14)
      .text(`ID No: #${employeeData[0].employee_code}`, 0, 310, {
        align: "center",
        width: 299,
      }); // Centered text

    doc
      .fillColor("white")
      .fontSize(14)
      .text(`Expire Date: ${moment().endOf('year').format('DD-MM-YYYY')}`, 0, 437, {
        align: "center",
        width: 299,
      }); // Centered text

    // ====================
    // Back Page
    // ====================
    doc.addPage(); // Add a new page for the back
    doc.image(card_back_background, 0, 0, { width: 299, height: 462 }); // Add back background image

    // Add content for the back page
    try {
      await fs.access(tsLogoPath); // Check if the logo exists

      // Get logo dimensions
      const dimensions = sizeOf(tsLogoPath);
      const tsLogo = { width: dimensions.width, height: dimensions.height };

      const logoWidth = 55; // Desired width of the logo
      const logoHeight = (tsLogo.height / tsLogo.width) * logoWidth; // Maintain aspect ratio

      // Calculate x-coordinate to center the logo
      const xLogo = (299 - logoWidth) / 2;

      // Position the logo at the top center
      doc.image(tsLogoPath, xLogo, 20, {
        width: logoWidth,
        height: logoHeight,
      });

      // Add "TS Company" text below the logo (centered)
      doc
        .fillColor("white")
        .fontSize(16)
        .text("TS Company", 0, 15 + logoHeight + 10, {
          align: "center",
          width: 299,
        });
    } catch (error) {
      console.error("TS logo not found:", tsLogoPath);
      // Continue without the logo
    }

    try {
      await fs.access(tsLogoPath); // Check if the logo exists

      // Get logo dimensions
      const dimensions = sizeOf(tsLogoPath);
      const tsLogo = { width: dimensions.width, height: dimensions.height };

      const logoWidth = 55; // Desired width of the logo
      const logoHeight = (tsLogo.height / tsLogo.width) * logoWidth; // Maintain aspect ratio

      // Calculate x-coordinate to center the logo
      const xLogo = (299 - logoWidth) / 2;

      // Position the logo at the top center
      doc.image(tsLogoPath, xLogo, 20, {
        width: logoWidth,
        height: logoHeight,
      });

      // Add "TS Company" text below the logo (centered)
      doc
        .fillColor("white")
        .fontSize(16)
        .text("TS Company", 0, 15 + logoHeight + 10, {
          align: "center",
          width: 299,
        });
    } catch (error) {
      console.error("TS logo not found:", tsLogoPath);
      // Continue without the logo
    }
    
    const listItems = [
      `This card is the property of [Company Name] and is not transformable.`,
      `The employee must wear this card in the company at all time.`,
      ` If the card is lost, Please inform the HR department to issue a new card`,
      `This card must be returned to HR upon the registration.`
    ];

    const pageWidth = 299; // Total width of the page
    const rightMargin = 100; // Desired right margin

    const textWidth = pageWidth - 20 - rightMargin; // 20 is the left margin

    const listStartY = 160; // Starting Y position for the list
    const lineHeight = 35; // Space between list items
    doc
    .fillColor("black")
    .fontSize(14)
    .text("INSTRUCTIONS ", 0,  135, {
      align: "center",
      width: 299,
    });
    listItems.forEach((item, index) => {
      doc.fillColor('black')
        .fontSize(12)
        .text(`• ${item}`, 20, listStartY + index * lineHeight), // Use bullet points
        {
          width : textWidth,
          align : 'left'
        }
    });

    doc
    .fillColor("white")
    .fontSize(14)
    .text(`Expire Date: ${moment().endOf('year').format('DD-MM-YYYY')}`, 0, 437, {
      align: "center",
      width: 299,
    }); // Centered text
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  }
};

module.exports = { generateEmployeeCard };
