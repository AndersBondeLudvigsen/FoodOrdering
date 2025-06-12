<style>
  footer {
    background-color: #f5f5f5;
    color: #333;
    text-align: center;
    padding: 1.5rem 1rem;
    border-top: 1px solid #ddd;
    font-size: 0.9rem;
    /* No margin-top here */
  }

  .footer-links {
    margin-bottom: 0.5rem;
  }

  .footer-links a {
    margin: 0 1rem;
    color: #333;
    text-decoration: none;
    font-weight: 500;
  }

  .footer-links a:hover {
    text-decoration: underline;
  }

  @media (max-width: 600px) {
    .footer-links {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .footer-links a {
      margin: 0;
    }
  }
</style>

<footer>
  <div class="footer-links">
    <a href="/">Home</a>
  </div>

  <div class="footer-description">
    We are a modern food system dedicated to bringing fresh meals and smart kitchen solutions to everyone. Quality, speed, and sustainability are at our core.
  </div>

  <div>
    &copy; {new Date().getFullYear()} All rights reserved.
  </div>
</footer>
