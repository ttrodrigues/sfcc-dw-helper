import React, { useState, useEffect, useRef } from 'react';
import { ShowIcon } from './ShowIcon';
import { HideIcon } from './HideIcon';
import { History } from './History';
import { BracketMenu } from './BracketMenu';
import { SettingsMenu } from './SettingsMenu';
import { Loading } from './Loading';
import './Sidebar.css';

// Use the already acquired VSCode API from the global scope
declare const tsvscode: any;
const vscode = tsvscode;

// Declare global variables from the HTML template
declare const isProphetInstall: boolean;
declare const showDevBuildBtn: boolean;
declare const commandDevBuildBtn: string;
declare const showPrdBuildBtn: boolean;
declare const commandPrdBuildBtn: string;
declare const textDevBuildBtn: string;
declare const textPrdBuildBtn: string;
declare const hostname: string;
declare const codeversion: string;
declare const hostnameHistoryPropertyShort: string;
declare const codeversionHistoryPropertyShort: string;

export const Sidebar: React.FC = () => {
  const [initialView, setInitialView] = useState<string>('default');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [environment, setEnvironment] = useState<string>('');
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [page, setPage] = useState<'bracket' | 'settings'>(() => {
    const state = vscode.getState();
    return state?.page || 'bracket';
  });

  const hostnameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const codeversionRef = useRef<HTMLInputElement>(null);

  const isProphetInstalled = isProphetInstall || false;
  const isToShowDevBuildBtn = showDevBuildBtn || false;
  const textCommandDevBuildBtn = commandDevBuildBtn || '';
  const textLayoutDevBuildBtn = textDevBuildBtn || '';
  const isToShowPrdBuildBtn = showPrdBuildBtn || false;
  const textCommandPrdBuildBtn = commandPrdBuildBtn || '';
  const textLayoutPrdBuildBtn = textPrdBuildBtn || '';
  const codeversionConstant = codeversion || '';
  const hostnameConstant = hostname || '';
  const codeversionPropertyShort = codeversionHistoryPropertyShort || '';
  const hostnamePropertyShort = hostnameHistoryPropertyShort || '';

  useEffect(() => {
    vscode.setState({ page });
  }, [page]);

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'initialView': {
          setInitialView(message.data);

          if (message.data === 'checkWorkspace') {
            vscode.postMessage({
              type: 'onCheckWorkspace',
              value: true
            });
          }

          if (message.data === 'default') {
            updateMarginTopMain(true);
          } else {
            updateMarginTopMain(false);
          }

          if (message.data === 'default' && page === 'settings') {
            updateClass('.settings', '.bracket');
          }

          break;
        }

        case 'jsonValues': {
          if (page === 'bracket') {
            const jsonValues = message.data;

            if (hostnameRef.current) hostnameRef.current.value = jsonValues.hostname || '';
            if (usernameRef.current) usernameRef.current.value = jsonValues.username || '';
            if (passwordRef.current) passwordRef.current.value = jsonValues.password || '';
            if (codeversionRef.current) codeversionRef.current.value = jsonValues.codeversion || '';
          }

          break;
        }

        case 'loading': {
          const [loading, env] = message.data;
          setIsLoading(loading);
          setEnvironment(env);
          break;
        }
      }
    };

    window.addEventListener('message', messageHandler);

    if (initialView === 'default' && page === 'settings') {
      updateClass('.settings', '.bracket');
    }

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [page, initialView]);

  const changeJsonFile = () => {
    const hostname = hostnameRef.current?.value || '';
    const username = usernameRef.current?.value || '';
    const password = passwordRef.current?.value || '';
    const codeversion = codeversionRef.current?.value || '';

    const jsonContent = {
      "hostname": hostname,
      "username": username,
      "password": password,
      "code-version": codeversion
    };

    vscode.postMessage({
      type: 'onChangeFile',
      value: jsonContent
    });
  };

  const clickBtnCleanUpload = () => {
    vscode.postMessage({
      type: 'onCleanUpload',
      value: true
    });
  };

  const clickBtnDisableUpload = () => {
    vscode.postMessage({
      type: 'onDisableUpload',
      value: true
    });
  };

  const clickBtnEnableUpload = () => {
    vscode.postMessage({
      type: 'onEnableUpload',
      value: true
    });
  };

  const clickBtnNewCodeversion = () => {
    vscode.postMessage({
      type: 'onNewCodeversion',
      value: true
    });
  };

  const clickBtnDeleteCodeversion = () => {
    vscode.postMessage({
      type: 'onDeleteCodeversion',
      value: true
    });
  };

  const clickBtnBuild = (option: string) => {
    vscode.postMessage({
      type: 'onBuild',
      value: option
    });
  };

  const changeProperty = (input: string, property: string) => {
    vscode.postMessage({
      type: 'onChangeProperty',
      value: [input, property]
    });
  };

  const clickBtnHistory = (property: string) => {
    vscode.postMessage({
      type: 'onShowQuickPick',
      value: property
    });
  };

  const getInputData = () => {
    vscode.postMessage({
      type: 'onGetInputData',
      value: true
    });
  };

  const clickBtnLink = (isBusinessManager: boolean) => {
    vscode.postMessage({
      type: 'onBtnLink',
      value: [hostnameRef.current?.value || '', isBusinessManager]
    });
  };

  const clickBtnOpenSettings = () => {
    vscode.postMessage({
      type: 'onOpenSettings',
      value: true
    });
  };

  const buttonClick = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const updateClass = (classNameAdd: string, classNameRemove: string) => {
    const elementToAdd = document.querySelector(classNameAdd);
    elementToAdd?.classList.add('selected');
    const elementToRemove = document.querySelector(classNameRemove);
    elementToRemove?.classList.remove('selected');
  };

  const updateMarginTopMain = (isDefault: boolean) => {
    const mainElement = document.getElementById('main');
    if (mainElement) {
      mainElement.style.marginTop = isDefault ? '45px' : '5px';
    }
  };

  return (
    <>
      {initialView === 'default' && (
        <div className="buttons-wrapper">
          <button
            className="menu-button selected bracket"
            onClick={() => {
              setPage('bracket');
              getInputData();
              updateClass('.bracket', '.settings');
            }}
          >
            <BracketMenu />
          </button>
          <button
            className="menu-button settings"
            onClick={() => {
              setPage('settings');
              updateClass('.settings', '.bracket');
            }}
          >
            <SettingsMenu />
          </button>
        </div>
      )}

      <div id="main">
        {initialView === 'default' && (
          <>
            {isLoading && (
              <div className="loading-wrapper">
                <div className='loading'>
                  Connecting with {environment}...
                </div>
                <div className="svgLoading">
                  <Loading />
                </div>
              </div>
            )}

            {page === 'bracket' && (
              <div className={`environmentSettings ${isLoading ? 'd-none' : ''}`}>
                <div>
                  <div className="textInput">Hostname</div>
                  <input
                    type="text"
                    id="hostname"
                    ref={hostnameRef}
                    onChange={(e) => {
                      changeProperty(e.target.value, hostnamePropertyShort);
                      changeJsonFile();
                    }}
                  />
                  <button
                    id="btnSvgHostname"
                    onClick={() => {
                      clickBtnHistory(hostnameConstant);
                    }}
                  >
                    <History />
                  </button>
                </div>

                <div>
                  <div className="textInput">Code Version</div>
                  <input
                    type="text"
                    id="codeVersion"
                    ref={codeversionRef}
                    onChange={(e) => {
                      changeProperty(e.target.value, codeversionPropertyShort);
                      changeJsonFile();
                    }}
                  />
                  <button
                    id="btnSvgCodeversion"
                    onClick={() => {
                      clickBtnHistory(codeversionConstant);
                    }}
                  >
                    <History />
                  </button>
                </div>

                <div className="textInput">User Name</div>
                <input
                  type="text"
                  id="userName"
                  ref={usernameRef}
                  onChange={() => {
                    changeJsonFile();
                  }}
                />

                <div>
                  <div className="textInput">Password</div>
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    id="password"
                    ref={passwordRef}
                    onChange={() => {
                      changeJsonFile();
                    }}
                  />
                  <button
                    id="btnSvgPassword"
                    onClick={() => {
                      buttonClick();
                    }}
                  >
                    {isPasswordVisible ? <HideIcon /> : <ShowIcon />}
                  </button>
                </div>
              </div>
            )}

            {page === 'bracket' && (
              <div className={`environmentSettings ${isLoading ? 'd-none' : ''}`}>
                <div className="textButton">Environment Links</div>
                <div>
                  <button
                    onClick={() => {
                      clickBtnLink(true);
                    }}
                    className="btn"
                  >
                    Open Business Manager
                  </button>
                </div>

                <div>
                  <button
                    onClick={() => {
                      clickBtnLink(false);
                    }}
                    className="btn"
                  >
                    Open StoreFront
                  </button>
                </div>
              </div>
            )}

            {page === 'settings' && (
              <div className={`settings-wrapper ${isLoading ? 'd-none' : ''}`}>
                {isProphetInstalled && (
                  <>
                    <div className="btns-block">
                      <div className="textButton">Environment Settings</div>
                      <div>
                        <button
                          onClick={() => {
                            clickBtnNewCodeversion();
                          }}
                          className="btn"
                        >
                          New Code Version
                        </button>
                      </div>

                      <div>
                        <button
                          onClick={() => {
                            clickBtnDeleteCodeversion();
                          }}
                          className="btn"
                        >
                          Delete Code Version
                        </button>
                      </div>
                    </div>

                    {(isToShowDevBuildBtn || isToShowPrdBuildBtn) && (
                      <>
                        <div className="textButton">Compiler</div>
                        <div className="btns-block">
                          {isToShowDevBuildBtn && (
                            <div>
                              <button
                                onClick={() => {
                                  clickBtnBuild(textCommandDevBuildBtn);
                                }}
                                className="btn"
                              >
                                {textLayoutDevBuildBtn}
                              </button>
                            </div>
                          )}

                          {isToShowPrdBuildBtn && (
                            <div>
                              <button
                                onClick={() => {
                                  clickBtnBuild(textCommandPrdBuildBtn);
                                }}
                                className="btn"
                              >
                                {textLayoutPrdBuildBtn}
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="btns-block">
                      <div className="textButton">Commands</div>
                      <div>
                        <button
                          onClick={() => {
                            clickBtnCleanUpload();
                          }}
                          className="btn"
                        >
                          Clean Project / Upload All
                        </button>
                      </div>

                      <div>
                        <button
                          onClick={() => {
                            clickBtnEnableUpload();
                          }}
                          className="btn"
                        >
                          Enable Upload
                        </button>
                      </div>

                      <div>
                        <button
                          onClick={() => {
                            clickBtnDisableUpload();
                          }}
                          className="btn"
                        >
                          Disable Upload
                        </button>
                      </div>
                    </div>

                    <div className="btns-block">
                      <div className="textButton">Configuration</div>
                      <div>
                        <button
                          onClick={() => {
                            clickBtnOpenSettings();
                          }}
                          className="btn"
                        >
                          Extension settings
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {initialView === 'noFile' && (
          <>
            <p className="message-text">This folder do not has a dw.json file or is not a SFCC project!</p>
            <p className="message-text">If you already have a workspace open, please click on bellow button to create a new dw.json file.</p>

            <button
              onClick={() => {
                vscode.postMessage({
                  type: 'onCreateFile',
                  value: true
                });
              }}
              id="btnCreate"
              className="btn"
            >
              Create a dw.json
            </button>
          </>
        )}

        {initialView === 'noWorkspace' && (
          <>
            <p className="message-text">Ups... This extensions needs a Workspace to run...</p>
            <p className="message-text">Please open a Workspace.</p>
          </>
        )}

        {initialView === 'schemaError' && (
          <>
            <p className="message-text">Detected a dw.json file with a schema error!</p>
            <p className="message-text">The properties names are incorrect or not in string format.</p>

            <button
              onClick={() => {
                vscode.postMessage({
                  type: 'onCreateFile',
                  value: false
                });
              }}
              id="btnFix"
              className="btn"
            >
              Fix the dw.json
            </button>
          </>
        )}
      </div>
    </>
  );
};
