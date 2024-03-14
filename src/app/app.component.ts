import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  Part,
} from '@google/generative-ai';
import { environment } from '../environments/environment';
import { FileConversionService } from './file-conversion.service';
import { NgxTypedJsModule } from 'ngx-typed-js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxTypedJsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  history: any;
  prompt?: string;
  multipartPrompt?: Part[];
  stringsToBeTyped: string[] = [];

  constructor(private fileConversionService: FileConversionService) {}

  ngOnInit(): void {}

  /**
   * Demonstrates Gemini Pro with a text-only input.
   */
  async textOnlyDemo() {
    this.clean();

    this.prompt =
      "You are a local historian researching the Bennington Triangle disappearances. Write a news report for a national audience detailing your recent findings, including interviews with eyewitnesses (vary details for each response - sightings of strange lights, unusual sounds, personal connection to a missing person). Maintain a neutral tone, presenting the facts while acknowledging the case's lack of resolution.";
    const result = await this.initializeModel('gemini-pro').generateContent(
      this.prompt
    );
    const response = await result.response;
    this.stringsToBeTyped = [response.text()];
  }

  /**
   * Demonstrates how to use Gemini Pro Vision with text and images as input (using an image in src/assets for convenience).
   */
  async multimodalDemo() {
    this.clean();

    try {
      let imageBase64 = await this.fileConversionService.convertToBase64(
        'assets/cheesecake.jpg'
      );

      // Check for successful conversion to Base64
      if (typeof imageBase64 !== 'string') {
        console.error('Image conversion to Base64 failed.');
        return;
      }

      this.multipartPrompt = [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
        {
          text: 'Provide me a good recipe.',
        },
      ];
      const result = await this.initializeModel(
        'gemini-pro-vision'
      ).generateContent(this.multipartPrompt);
      const response = await result.response;
      this.stringsToBeTyped = [response.text()];
    } catch (error) {
      console.error('Error converting file to Base64', error);
    }
  }

  /**
   * Demonstrates how to use Gemini Pro to build a multi-turn conversation
   */
  async chatDemo() {
    this.clean();
    this.history = [
      {
        role: 'user',
        parts: 'Hi, Gemini!',
      },
      {
        role: 'model',
        parts: "It's great to meet you. What do you want to know?",
      },
    ];

    const chat = this.initializeModel('gemini-pro').startChat({
      history: this.history,
      generationConfig: {
        maxOutputTokens: 100,
      },
    });

    this.prompt = 'What is the largest number with a name? Brief answer.';
    const result = await chat.sendMessage(this.prompt);
    const response = await result.response;
    this.stringsToBeTyped = [response.text()];
  }

  /**
   * Demonstrates how to use Gemini Pro to generate content using streaming
   */
  async streamDemo() {
    this.clean();
    this.prompt = 'Generate a poem.';

    const prompt = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: this.prompt,
            },
          ],
        },
      ],
    };
    const streamingResp = await this.initializeModel(
      'gemini-pro'
    ).generateContentStream(prompt);

    for await (const item of streamingResp.stream) {
      console.log('stream chunk: ' + item.text());
      this.stringsToBeTyped.push('stream chunk:  ' + item.text());
    }
    console.log(
      'aggregated response: ' + (await streamingResp.response).text()
    );
  }

  /**
   * Creates, configure with defaults, and returns the Google Gemini model from the SDK
   * @param model 'gemini-pro' | 'gemini-pro-vision'
   * @returns
   */
  private initializeModel(model: 'gemini-pro' | 'gemini-pro-vision') {
    const googleGenerativeAI = new GoogleGenerativeAI(
      environment.googleAIApiKey
    );
    const generationConfig = {
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
      ],
      temperature: 0.9,
      top_p: 1,
      top_k: 32,
      maxOutputTokens: 100, // limit output
    };
    return googleGenerativeAI.getGenerativeModel({
      model: model,
      ...generationConfig,
    });
  }

  private clean() {
    this.history = undefined;
    this.prompt = undefined;
    this.multipartPrompt = undefined;
    this.stringsToBeTyped = [];
  }
}
