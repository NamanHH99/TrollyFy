import React from "react";
import "../App.css";
function Header() {
  return ( 
    <div>
      <nav className="navbar row">
        <div className="col-12 col-md-3">
          <div className="navbar-brand">
            <img className="logoImage" src="./images/logo2.png" />
          </div>
        </div>

        <div className="col-12 col-md-6 mt-2 mt-md-0">
          <div className="input-group">
            <input
              type="text"
              id="search_field"
              className="form-control"
              placeholder="Search"
            />
            <div className="input-group-append">
              <button id="search_btn" className="btn">
              <i className="fa fa-search" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3 mt-4 mt-md-0 text-center">
          <button className="btn" id="login_btn">Login</button>
          <span id="cart" className="ml-3">Cart</span>
          <span className="ml-1" id="cart_count">2</span>
        </div>
    </nav>

  </div>
  );
}
export default Header;
